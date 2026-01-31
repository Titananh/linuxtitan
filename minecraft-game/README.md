# 🎮 Minecraft Clone - Basic Edition

Một trò chơi Minecraft đơn giản được xây dựng bằng HTML5 Canvas và JavaScript.

## 🚀 Cách chơi

### Mở game
1. Mở file `index.html` trong trình duyệt web (Chrome, Firefox, Edge...)
2. Hoặc sử dụng một local server:
   ```bash
   # Sử dụng Python
   cd minecraft-game
   python -m http.server 8000
   # Mở http://localhost:8000

   # Hoặc sử dụng Node.js
   npx serve .
   ```

### Điều khiển

| Phím | Hành động |
|------|-----------|
| **Click chuột** | Bắt đầu chơi (bắt chuột) |
| **W/A/S/D** | Di chuyển |
| **Space** | Nhảy |
| **Shift** | Đi chậm |
| **Chuột** | Nhìn xung quanh |
| **Click trái** | Phá khối |
| **Click phải** | Đặt khối |
| **1-9** | Chọn loại khối |
| **ESC** | Thả chuột |

## 🧱 Các loại khối

1. **Cỏ (Grass)** - Khối với cỏ xanh trên mặt
2. **Đất (Dirt)** - Khối đất nâu
3. **Đá (Stone)** - Khối đá xám
4. **Gỗ (Wood)** - Thân cây
5. **Lá (Leaves)** - Lá cây
6. **Cát (Sand)** - Khối cát vàng
7. **Nước (Water)** - Khối nước trong suốt
8. **Gạch (Brick)** - Khối gạch đỏ
9. **Đá cuội (Cobblestone)** - Khối đá cuội

## ✨ Tính năng

- 🌍 **Thế giới 3D**: Render góc nhìn người thứ nhất
- 🏗️ **Xây dựng**: Đặt và phá các khối
- 🌳 **Cây cối**: Thế giới được tạo với cây
- 🎨 **9 loại khối**: Nhiều loại vật liệu khác nhau
- 🏃 **Vật lý**: Trọng lực và va chạm
- 🎯 **Targeting**: Highlight khối đang nhìn

## 🛠️ Công nghệ

- HTML5 Canvas
- Vanilla JavaScript (không thư viện)
- CSS3

## 📁 Cấu trúc file

```
minecraft-game/
├── index.html    # Trang chính
├── style.css     # Giao diện
├── game.js       # Logic game
└── README.md     # Hướng dẫn
```

## 📝 Ghi chú

- Game hoạt động tốt nhất trên trình duyệt hiện đại
- Cần JavaScript được bật
- Pointer Lock API được sử dụng để điều khiển chuột

## 🎨 Screenshot

Mở file `index.html` để trải nghiệm game!

---

*Được tạo như một dự án học tập về game development với JavaScript*
