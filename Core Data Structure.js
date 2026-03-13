{
  id: "string",      // 唯一标识符，如 'ground1', 'player', 'star1'
  name: "string",    // 显示名称，如 '主平台'
  type: "string",    // 类型，'image' 或 'sprite'
  image: "string",   // 图片URL或Base64数据
  x: number,         // X坐标
  y: number,         // Y坐标
  status: "string",  // 状态: 'active'(玩家), 'static'(平台), 'interactive'(可收集物)
  depth: number,     // 渲染深度，越大越靠前
  scale: number,     // 缩放比例，默认为1
  properties: {      // 扩展物理属性 (可选)
    bounce: number,      // 弹力系数
    collideWorldBounds: boolean, // 是否与世界边界碰撞
    physics: boolean     // 是否启用物理
  }
}