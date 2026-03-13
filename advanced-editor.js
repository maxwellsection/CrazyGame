// 游戏元素数据 - 增强的数据结构，用于精确生成代码
let gameElements = [
    { 
        id: 'sky', 
        name: '背景', 
        type: 'image', 
        image: 'https://labs.phaser.io/assets/skies/space3.png', 
        x: 400, y: 200, 
        status: 'static', 
        depth: 0,
        scale: 1
    },
    { 
        id: 'ground1', 
        name: '主平台', 
        type: 'image', 
        image: 'https://labs.phaser.io/assets/sprites/platform.png', 
        x: 400, y: 385, 
        status: 'static', 
        depth: 1, 
        scale: 2 
    },
    { 
        id: 'player', 
        name: '玩家', 
        type: 'sprite', 
        image: 'https://labs.phaser.io/assets/sprites/dude.png', 
        x: 100, y: 300, 
        status: 'active', 
        depth: 10,
        properties: { bounce: 0.2, collideWorldBounds: true, physics: true } // 扩展属性
    },
    { 
        id: 'star1', 
        name: '星星1', 
        type: 'sprite', 
        image: 'https://labs.phaser.io/assets/sprites/star.png', 
        x: 600, y: 200, 
        status: 'interactive', 
        depth: 5,
        properties: { bounce: 0.4, physics: true }
    }
];
let selectedElement = null;
let isRunning = false;
let currentGame = null;
let editorObjects = {};

// ============================================
// 游戏代码管理器 (GameCodeManager) - 完全重构
// ============================================
const GameCodeManager = {
    STORAGE_KEY: 'lite_game_maker_exported_code',

    /**
     * 根据 gameElements 数据，生成完整的、可独立运行的HTML游戏代码。
     * 这是LLM需要学习的关键生成逻辑。
     */
    generateGameCode() {
        // 1. 生成资源预加载代码
        const preloadCode = gameElements.map(elem => {
            if (elem.image && elem.image.startsWith('data:')) {
                return `        // ${elem.name} (Base64) 已内嵌`;
            } else if (elem.image && elem.id !== 'player') { // 玩家用特殊spritesheet
                return `        this.load.image('${elem.id}', '${elem.image}');`;
            }
            return '';
        }).filter(line => line).join('\n');

        // 2. 生成场景创建代码 (这是核心，LLM必须理解此结构)
        let createCode = '';

        // 静态物体组 (platforms)
        const staticElems = gameElements.filter(e => e.status === 'static');
        if (staticElems.length) {
            createCode += `        // 平台与静态物体\n        this.platforms = this.physics.add.staticGroup();\n`;
            staticElems.forEach(elem => {
                createCode += `        this.platforms.create(${elem.x}, ${elem.y}, '${elem.id}')`;
                if (elem.scale && elem.scale !== 1) createCode += `.setScale(${elem.scale})`;
                createCode += `.refreshBody();\n`;
            });
        }

        // 玩家 (特殊处理)
        const playerElem = gameElements.find(e => e.id === 'player');
        if (playerElem) {
            createCode += `\n        // 玩家\n        this.player = this.physics.add.sprite(${playerElem.x}, ${playerElem.y}, 'dude');\n`;
            if (playerElem.properties) {
                if (playerElem.properties.bounce) createCode += `        this.player.setBounce(${playerElem.properties.bounce});\n`;
                if (playerElem.properties.collideWorldBounds) createCode += `        this.player.setCollideWorldBounds(true);\n`;
            }
            if (staticElems.length) createCode += `        this.physics.add.collider(this.player, this.platforms);\n`;
        }

        // 可互动物体组 (stars/collectables)
        const interactiveElems = gameElements.filter(e => e.status === 'interactive');
        if (interactiveElems.length) {
            createCode += `\n        // 可收集物品\n        this.stars = this.physics.add.group();\n`;
            interactiveElems.forEach(elem => {
                createCode += `        const ${elem.id} = this.physics.add.image(${elem.x}, ${elem.y}, '${elem.id}');\n`;
                if (elem.properties && elem.properties.bounce) {
                    createCode += `        ${elem.id}.setBounce(${elem.properties.bounce});\n`;
                }
                createCode += `        this.stars.add(${elem.id});\n`;
            });
            if (staticElems.length) createCode += `        this.physics.add.collider(this.stars, this.platforms);\n`;
            if (playerElem) {
                createCode += `        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);\n`;
            }
        }

        // 动画定义 (固定部分，可扩展)
        if (playerElem) {
            createCode += `\n        // 玩家动画\n        this.anims.create({ key: 'left', frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });\n`;
            createCode += `        this.anims.create({ key: 'turn', frames: [{ key: 'dude', frame: 4 }], frameRate: 20 });\n`;
            createCode += `        this.anims.create({ key: 'right', frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }), frameRate: 10, repeat: -1 });\n`;
        }

        // 控制与UI
        createCode += `\n        // 控制与UI\n        this.cursors = this.input.keyboard.createCursorKeys();\n`;
        createCode += `        this.score = 0;\n`;
        createCode += `        this.scoreText = this.add.text(16, 16, '分数: 0', { fontSize: '32px', fill: '#fff' });\n`;

        const fullHTMLCode = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的游戏</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; overflow: hidden; }
        body { margin: 0; padding: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: #000; }
        #game-container { width: 100%; height: 100%; display: block; }
    </style>
</head>
<body>
    <div id="game-container"></div>
    <script>
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 400,
            parent: 'game-container',
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
            physics: { default: 'arcade', arcade: { gravity: { y: 300 }, debug: false } },
            scene: {
                preload: function() {
${preloadCode}
                    this.load.spritesheet('dude', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
                },
                create: function() {
${createCode}
                },
                update: function() {
                    if (!this.player) return;
                    if (this.cursors.left.isDown) {
                        this.player.setVelocityX(-160);
                        this.player.anims.play('left', true);
                    } else if (this.cursors.right.isDown) {
                        this.player.setVelocityX(160);
                        this.player.anims.play('right', true);
                    } else {
                        this.player.setVelocityX(0);
                        this.player.anims.play('turn');
                    }
                    if (this.cursors.up.isDown && this.player.body.touching.down) {
                        this.player.setVelocityY(-330);
                    }
                },
                collectStar: function(player, star) {
                    star.disableBody(true, true);
                    this.score += 10;
                    this.scoreText.setText('分数: ' + this.score);
                }
            }
        };
        new Phaser.Game(config);
    </script>
</body>
</html>`;
        return fullHTMLCode;
    },

    /**
     * 尝试从用户编辑的代码中解析出 gameElements。
     * 这是实现“应用代码”按钮反向解析的关键，也是LLM输出的代码需要符合规范的原因。
     */
    parseCodeToElements(code) {
        // 这是一个简化的解析器。在实际的LLM集成中，LLM应直接输出结构化数据。
        // 这里我们尝试从代码中提取元素信息，并更新现有的gameElements。
        const newElements = [...gameElements]; // 从当前状态开始

        // 示例：解析平台创建代码 (实际应更复杂，使用正则或AST)
        // 查找类似：this.platforms.create(400, 385, 'ground1').setScale(2).refreshBody();
        const platformRegex = /this\.platforms\.create\((\d+),\s*(\d+),\s*'([\w\d]+)'\)/g;
        let match;
        while ((match = platformRegex.exec(code)) !== null) {
            const [, x, y, id] = match;
            const elem = newElements.find(e => e.id === id);
            if (elem) {
                elem.x = parseInt(x);
                elem.y = parseInt(y);
                elem.status = 'static';
            }
        }

        // 解析玩家
        const playerRegex = /this\.player\s*=\s*this\.physics\.add\.sprite\((\d+),\s*(\d+),/;
        const playerMatch = playerRegex.exec(code);
        if (playerMatch) {
            const [, x, y] = playerMatch;
            const playerElem = newElements.find(e => e.id === 'player');
            if (playerElem) {
                playerElem.x = parseInt(x);
                playerElem.y = parseInt(y);
            }
        }

        // 注意：这是一个基础示例。完整的解析器需要处理所有代码结构。
        // 对于生产环境，建议LLM直接操作gameElements数据，或生成极其规范的代码。
        console.log('从代码解析出的元素位置已更新');
        return newElements; // 返回解析后的新数组
    },

    saveCurrentCode() {
        const code = this.generateGameCode();
        localStorage.setItem(this.STORAGE_KEY, code);
        return code;
    },

    getCurrentCode() {
        return localStorage.getItem(this.STORAGE_KEY) || this.generateGameCode();
    },

    runCodeInContainer(containerId) {
        const code = this.getCurrentCode();
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `<iframe id="game-iframe" style="width:100%; height:100%; border:none; background:#000;"></iframe>`;
        const iframeDoc = container.firstChild.contentDocument || container.firstChild.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(code);
        iframeDoc.close();
    },

    downloadCode() {
        const code = this.getCurrentCode();
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my_game.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
// ============================================
// 游戏代码管理器 结束
// ============================================

// 编辑模式配置 (与之前类似，用于拖拽编辑)
const editorConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: { preload: editorPreload, create: editorCreate, update: editorUpdate }
};

function initEditor() {
    const container = document.getElementById('game-container');
    if (!container) return;
    container.innerHTML = '';
    if (currentGame) { try { currentGame.destroy(true); } catch(e) {} currentGame = null; }
    setTimeout(() => { currentGame = new Phaser.Game(editorConfig); }, 100);
}

function editorPreload() {
    gameElements.forEach(elem => {
        if (elem.image && !elem.image.startsWith('data:')) {
            this.load.image(elem.id, elem.image);
        }
    });
    this.load.spritesheet('dude', 'https://labs.phaser.io/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
}

function editorCreate() {
    editorObjects = {};
    const sorted = [...gameElements].sort((a, b) => a.depth - b.depth);
    sorted.forEach(elem => {
        try {
            let obj = (elem.id === 'player') 
                ? this.add.sprite(elem.x, elem.y, 'dude')
                : this.add.image(elem.x, elem.y, elem.id);
            if (elem.scale) obj.setScale(elem.scale);
            obj.setDepth(elem.depth);
            obj.setInteractive({ draggable: true, cursor: 'pointer' });
            obj.setData('elementId', elem.id);
            obj.on('drag', (p, dragX, dragY) => {
                obj.x = dragX; obj.y = dragY;
                const el = gameElements.find(e => e.id === elem.id);
                if (el) { el.x = dragX; el.y = dragY; }
                if (selectedElement && selectedElement.id === elem.id) updatePropertyEditor(el);
                // 拖拽时实时保存代码（可选，频繁操作可能影响性能）
                // GameCodeManager.saveCurrentCode();
            });
            obj.on('pointerdown', (p) => { selectElement(elem.id); if (p.rightButtonDown()) showContextMenu(p, elem.id); });
            editorObjects[elem.id] = obj;
        } catch(e) { console.error('创建元素失败:', elem.id, e); }
    });
    this.input.on('contextmenu', e => e.preventDefault());
}
function editorUpdate() {}

// ============================================
// UI 更新函数 (必须调用代码生成)
// ============================================
function selectElement(id) {
    selectedElement = gameElements.find(e => e.id === id);
    document.querySelectorAll('.element-item').forEach(item => item.classList.toggle('selected', item.dataset.elementId === id));
    updatePropertyEditor(selectedElement);
    updateCodeViewer(); // 选择元素时更新代码视图
    Object.keys(editorObjects).forEach(k => editorObjects[k]?.setTint(k === id ? 0x00ff00 : 0xffffff));
}

function renderElementList() {
    const list = document.getElementById('element-list');
    if (!list) return;
    list.innerHTML = '';
    gameElements.forEach(el => {
        const item = document.createElement('div');
        item.className = 'element-item border rounded p-2 mb-2';
        item.dataset.elementId = el.id;
        const statusClass = el.status === 'active' ? 'bg-success' : el.status === 'static' ? 'bg-info' : 'bg-warning';
        const statusText = el.status === 'active' ? '活跃' : el.status === 'static' ? '静态' : '互动';
        item.innerHTML = `<div class="row align-items-center">
            <div class="col-3"><img src="${el.image}" class="element-image" style="width:50px;height:50px;object-fit:contain;background:#f8f9fa;"></div>
            <div class="col-5"><small class="fw-bold">${el.name}</small><div class="x-small text-muted">${el.id}</div></div>
            <div class="col-4 text-end"><span class="badge ${statusClass}">${statusText}</span></div></div>`;
        item.onclick = () => selectElement(el.id);
        list.appendChild(item);
    });
}

function updatePropertyEditor(el) {
    const editorDiv = document.getElementById('property-editor');
    if (!el) { editorDiv.innerHTML = '<p class="text-muted">请选择一个元素查看属性</p>'; return; }
    editorDiv.innerHTML = `
        <div class="mb-2"><label class="form-label">元素名称</label><input type="text" class="form-control form-control-sm" id="prop-name" value="${el.name}"></div>
        <div class="mb-2"><label class="form-label">状态</label><select class="form-select form-select-sm" id="prop-status">
            <option value="active" ${el.status==='active'?'selected':''}>活跃</option>
            <option value="static" ${el.status==='static'?'selected':''}>静态</option>
            <option value="interactive" ${el.status==='interactive'?'selected':''}>互动</option></select></div>
        <div class="row mb-2"><div class="col-6"><label class="form-label">X坐标</label><input type="number" class="form-control form-control-sm" id="prop-x" value="${el.x}"></div>
        <div class="col-6"><label class="form-label">Y坐标</label><input type="number" class="form-control form-control-sm" id="prop-y" value="${el.y}"></div></div>
        <div class="row mb-2"><div class="col-6"><label class="form-label">深度</label><input type="number" class="form-control form-control-sm" id="prop-depth" value="${el.depth}"></div>
        <div class="col-6"><label class="form-label">缩放</label><input type="number" class="form-control form-control-sm" id="prop-scale" value="${el.scale || 1}" step="0.1"></div></div>
        <div class="mb-2"><label class="form-label">图片URL</label><div class="input-group input-group-sm">
            <input type="text" class="form-control" id="prop-image" value="${el.image}">
            <button class="btn btn-outline-secondary" id="upload-btn">上传</button></div></div>
        <button class="btn btn-primary btn-sm" id="save-btn">保存属性</button>
        <button class="btn btn-outline-danger btn-sm ms-2" id="delete-btn">删除元素</button>`;
    document.getElementById('save-btn').onclick = () => saveProperties(el.id);
    document.getElementById('delete-btn').onclick = () => deleteElement(el.id);
    document.getElementById('upload-btn').onclick = () => document.getElementById('image-upload').click();
}

// ============================================
// 核心操作函数 (都会触发代码重新生成)
// ============================================
function saveProperties(id) {
    const el = gameElements.find(e => e.id === id);
    if (!el) return;
    el.name = document.getElementById('prop-name').value;
    el.status = document.getElementById('prop-status').value;
    el.x = parseInt(document.getElementById('prop-x').value) || 0;
    el.y = parseInt(document.getElementById('prop-y').value) || 0;
    el.depth = parseInt(document.getElementById('prop-depth').value) || 0;
    el.scale = parseFloat(document.getElementById('prop-scale').value) || 1;
    el.image = document.getElementById('prop-image').value;
    
    // 同步到编辑视图
    if (editorObjects[id]) { editorObjects[id].x = el.x; editorObjects[id].y = el.y; editorObjects[id].setDepth(el.depth); if(el.scale) editorObjects[id].setScale(el.scale); }
    
    // 保存并更新
    GameCodeManager.saveCurrentCode();
    renderElementList();
    updateCodeViewer(); // 属性保存后更新代码视图
    if (isRunning) GameCodeManager.runCodeInContainer('game-container');
    alert('属性已保存，游戏代码已更新！');
}

function deleteElement(id) {
    if (!confirm('确定删除此元素？')) return;
    gameElements = gameElements.filter(e => e.id !== id);
    if (editorObjects[id]) { editorObjects[id].destroy(); delete editorObjects[id]; }
    selectedElement = null;
    GameCodeManager.saveCurrentCode();
    renderElementList();
    updatePropertyEditor(null);
    updateCodeViewer();
    if (isRunning) GameCodeManager.runCodeInContainer('game-container');
    else initEditor();
    alert('元素已删除！');
}

function addNewElement() {
    const id = 'element_' + Date.now();
    const newElement = { 
        id, name: '新元素', type: 'image', 
        image: 'https://labs.phaser.io/assets/sprites/dude.png', 
        x: 400, y: 200, status: 'active', depth: gameElements.length + 1, scale: 1
    };
    gameElements.push(newElement);
    GameCodeManager.saveCurrentCode();
    if (isRunning) {
        GameCodeManager.runCodeInContainer('game-container');
    } else {
        initEditor();
    }
    renderElementList();
    updateCodeViewer();
    selectElement(id);
}

function bringToFront(id) {
    const el = gameElements.find(e => e.id === id);
    if (el) {
        el.depth = Math.max(...gameElements.map(e => e.depth)) + 1;
        if (editorObjects[id]) editorObjects[id].setDepth(el.depth);
        GameCodeManager.saveCurrentCode();
        updateCodeViewer();
    }
}
function sendToBack(id) {
    const el = gameElements.find(e => e.id === id);
    if (el) {
        el.depth = Math.min(...gameElements.map(e => e.depth)) - 1;
        if (editorObjects[id]) editorObjects[id].setDepth(el.depth);
        GameCodeManager.saveCurrentCode();
        updateCodeViewer();
    }
}

// ============================================
// 代码查看与双向绑定关键函数
// ============================================
function updateCodeViewer() {
    const viewer = document.getElementById('code-viewer');
    if (!viewer) return;
    const currentCode = GameCodeManager.getCurrentCode();
    viewer.innerHTML = `
        <div class="small text-muted mb-1">游戏代码 (根据上方元素列表生成)</div>
        <textarea id="code-editor" style="width:100%; height:280px; font-family: monospace; font-size:12px; white-space: pre; overflow-wrap: normal;">${currentCode}</textarea>
        <div class="mt-2">
            <button class="btn btn-primary btn-sm" id="apply-code-btn">应用此代码</button>
            <button class="btn btn-outline-secondary btn-sm" id="copy-code-btn">复制代码</button>
        </div>`;
    
    // “应用代码” - 实现双向绑定的关键：从代码解析回元素数据
    document.getElementById('apply-code-btn').onclick = function() {
        const newCode = document.getElementById('code-editor').value;
        try {
            // 1. 保存用户编辑的代码
            localStorage.setItem(GameCodeManager.STORAGE_KEY, newCode);
            // 2. 尝试从新代码解析出元素数据 (关键步骤)
            const parsedElements = GameCodeManager.parseCodeToElements(newCode);
            // 3. 更新核心数据源
            gameElements = parsedElements;
            // 4. 更新所有UI
            renderElementList();
            updatePropertyEditor(selectedElement);
            // 5. 更新游戏预览
            if (isRunning) {
                GameCodeManager.runCodeInContainer('game-container');
            } else {
                initEditor();
            }
            alert('代码已应用！元素数据已同步更新。');
        } catch (e) {
            alert('应用代码时出错，代码可能不符合规范：' + e.message);
        }
    };
    document.getElementById('copy-code-btn').onclick = function() {
        navigator.clipboard.writeText(document.getElementById('code-editor').value);
        alert('代码已复制！');
    };
}

// ============================================
// 模式切换与主初始化
// ============================================
function startGame() {
    GameCodeManager.saveCurrentCode();
    GameCodeManager.runCodeInContainer('game-container');
    document.getElementById('start-btn').textContent = '编辑模式';
    document.getElementById('start-btn').className = 'btn btn-warning w-100 btn-sm';
    isRunning = true;
}
function editGame() {
    initEditor();
    document.getElementById('start-btn').textContent = '运行游戏';
    document.getElementById('start-btn').className = 'btn btn-success w-100 btn-sm';
    isRunning = false;
}

window.onload = function() {
    // 初始化为编辑模式
    isRunning = false;
    initEditor();
    renderElementList();
    updateCodeViewer();
    
    // 绑定事件
    document.getElementById('start-btn').onclick = startGame;
    document.getElementById('download-code-btn').onclick = () => GameCodeManager.downloadCode();
    document.getElementById('reset-btn').onclick = function() {
        if (isRunning) GameCodeManager.runCodeInContainer('game-container');
        else initEditor();
    };
    document.getElementById('back-btn').onclick = () => window.location.href = 'index.html';
    document.getElementById('add-element-btn').onclick = addNewElement;
    document.getElementById('advanced-mode-btn').onclick = () => alert('已在高级模式');
    
    // AI生成按钮 - 示例：未来这里将调用LLM API，并更新gameElements
    document.getElementById('ai-generate').onclick = function() {
        const prompt = document.getElementById('ai-prompt').value;
        const resultDiv = document.getElementById('ai-result');
        resultDiv.innerHTML = '<p>正在请求AI生成代码...</p>';
        // 模拟AI处理
        setTimeout(() => {
            // 模拟AI返回了一段新的代码
            const aiGeneratedCode = GameCodeManager.generateGameCode(); // 暂时用当前代码模拟
            // 未来：这里将接收AI返回的代码或结构化数据，然后调用 `applyCodeFromAI`
            resultDiv.innerHTML = `<pre>${aiGeneratedCode.substring(0,300)}...</pre>
                                   <p class="text-success">AI代码已生成。点击下方“应用此代码”按钮应用。</p>`;
        }, 1500);
    };
};