// 游戏配置
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// 游戏变量
let game;
let player;
let platforms;
let cursors;
let stars;
let score = 0;
let scoreText;

// 初始化游戏
function initGame() {
    // 确保游戏容器为空
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        // 清空容器内的所有子元素
        while (gameContainer.firstChild) {
            gameContainer.removeChild(gameContainer.firstChild);
        }
    }
    
    // 销毁旧的游戏实例
    if (game) {
        game.destroy(true); // true表示完全销毁，包括DOM元素
        game = null;
    }
    
    // 等待一小段时间，确保DOM元素完全清理
    setTimeout(() => {
        // 创建新的游戏实例
        game = new Phaser.Game(config);
    }, 50);
}

// 加载游戏资源
function preload() {
    this.load.image('sky', 'https://labs.phaser.io/assets/skies/space3.png');
    this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');
    this.load.image('star', 'https://labs.phaser.io/assets/sprites/star.png');
    this.load.spritesheet('dude', 'https://labs.phaser.io/assets/sprites/dude.png', {
        frameWidth: 32,
        frameHeight: 48
    });
}

// 创建游戏场景
function create() {
    // 添加背景
    this.add.image(400, 200, 'sky');
    
    // 创建平台
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 400, 'ground').setScale(2).refreshBody();
    platforms.create(600, 250, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 150, 'ground');
    
    // 创建玩家
    player = this.physics.add.sprite(100, 300, 'dude');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    
    // 动画
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    
    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });
    
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
    
    // 碰撞检测
    this.physics.add.collider(player, platforms);
    
    // 键盘控制
    cursors = this.input.keyboard.createCursorKeys();
    
    // 创建星星
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });
    
    stars.children.iterate(function (child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });
    
    this.physics.add.collider(stars, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);
    
    // 分数文本
    scoreText = this.add.text(16, 16, '分数: 0', {
        fontSize: '32px',
        fill: '#000'
    });
}

// 更新游戏状态
function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }
    
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

// 收集星星
function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('分数: ' + score);
}

// 初始化游戏
window.onload = function() {
    initGame();
    
    // 绑定按钮事件
    document.getElementById('start-btn').addEventListener('click', function() {
        if (game) {
            // 检查游戏是否存在且场景是否被暂停
            if (game.scene && game.scene.isPaused()) {
                game.scene.resume();
            }
        } else {
            // 如果游戏未初始化，则初始化游戏
            initGame();
        }
    });
    
    document.getElementById('pause-btn').addEventListener('click', function() {
        if (game && game.scene && !game.scene.isPaused()) {
            game.scene.pause();
        }
    });
    
    document.getElementById('reset-btn').addEventListener('click', function() {
        score = 0;
        initGame();
    });
    
    // 高级模式按钮事件
    document.getElementById('advanced-mode-btn').addEventListener('click', function() {
        // 跳转到高级模式页面
        window.location.href = 'advanced-mode.html';
    });
    
    // AI生成按钮事件
    document.getElementById('ai-generate').addEventListener('click', function() {
        const prompt = document.getElementById('ai-prompt').value;
        const resultDiv = document.getElementById('ai-result');
        
        // 显示加载状态
        resultDiv.innerHTML = '<p>AI正在生成游戏代码...</p>';
        
        // 模拟AI API响应
        setTimeout(function() {
            let generatedCode = '';
            
            if (prompt.includes('平台跳跃')) {
                generatedCode = `// 平台跳跃游戏代码
class PlatformerGame extends Phaser.Scene {
    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('player', 'assets/player.png');
        this.load.image('obstacle', 'assets/obstacle.png');
    }
    
    create() {
        // 添加背景
        this.add.image(400, 200, 'sky');
        
        // 创建平台
        const platforms = this.physics.add.staticGroup();
        platforms.create(400, 380, 'ground').setScale(2).refreshBody();
        platforms.create(600, 250, 'ground');
        platforms.create(50, 250, 'ground');
        
        // 创建玩家
        const player = this.physics.add.sprite(100, 300, 'player');
        player.setBounce(0.2);
        player.setCollideWorldBounds(true);
        
        // 碰撞检测
        this.physics.add.collider(player, platforms);
        
        // 键盘控制
        const cursors = this.input.keyboard.createCursorKeys();
        
        // 游戏循环
        this.physics.add.collider(player, platforms);
        
        // 键盘控制
        this.input.keyboard.on('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                player.setVelocityX(-160);
            } else if (event.key === 'ArrowRight') {
                player.setVelocityX(160);
            } else if (event.key === 'ArrowUp' && player.body.touching.down) {
                player.setVelocityY(-330);
            }
        });
        
        this.input.keyboard.on('keyup', (event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                player.setVelocityX(0);
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 },
            debug: false
        }
    },
    scene: PlatformerGame
};

const game = new Phaser.Game(config);`;
            } else if (prompt.includes('射击')) {
                generatedCode = `// 射击游戏代码
class ShooterGame extends Phaser.Scene {
    preload() {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('player', 'assets/player.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('enemy', 'assets/enemy.png');
    }
    
    create() {
        // 添加背景
        this.add.image(400, 200, 'sky');
        
        // 创建玩家
        this.player = this.physics.add.sprite(400, 350, 'player');
        this.player.setCollideWorldBounds(true);
        
        // 键盘控制
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // 子弹组
        this.bullets = this.physics.add.group();
        
        // 敌人组
        this.enemies = this.physics.add.group();
        
        // 初始化射击计时器
        this.lastFired = 0;
        
        // 生成敌人
        this.time.addEvent({
            delay: 1000,
            callback: this.spawnEnemy, 
            callbackScope: this,
            loop: true
        });
        
        // 碰撞检测
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemy, null, this);
    }
    
    update() {
        // 玩家移动
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }
        
        // 射击
        if (this.cursors.space.isDown && this.lastFired < this.time.now) {
            const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
            bullet.setVelocityY(-300);
            bullet.setCollideWorldBounds(true);
            bullet.body.onWorldBounds = true;
            this.lastFired = this.time.now + 100;
        }
    }
    
    spawnEnemy() {
        const x = Phaser.Math.Between(0, 800);
        const enemy = this.enemies.create(x, 0, 'enemy');
        enemy.setVelocityY(100);
        enemy.setCollideWorldBounds(true);
    }
    
    hitEnemy(bullet, enemy) {
        bullet.destroy();
        enemy.destroy();
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: ShooterGame
};

const game = new Phaser.Game(config);`;
            } else {
                generatedCode = `// 基本游戏模板
class MyGame extends Phaser.Scene {
    preload() {
        // 加载游戏资源
        this.load.image('background', 'assets/background.png');
        this.load.image('player', 'assets/player.png');
    }
    
    create() {
        // 添加背景
        this.add.image(400, 200, 'background');
        
        // 创建玩家
        this.player = this.physics.add.sprite(400, 200, 'player');
        this.player.setCollideWorldBounds(true);
        
        // 键盘控制
        this.cursors = this.input.keyboard.createCursorKeys();
    }
    
    update() {
        // 玩家移动
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }
        
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-160);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(160);
        } else {
            this.player.setVelocityY(0);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: MyGame
};

const game = new Phaser.Game(config);`;
            }
            
            resultDiv.innerHTML = `<pre>${generatedCode}</pre>`;
        }, 1500);
    });
};