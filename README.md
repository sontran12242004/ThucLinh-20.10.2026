# 💐 ThucLinh-20.10.2026
### Gửi em · 20/10 — Quà tặng Thục Linh

> Một website nhỏ, làm bằng cả tấm lòng, gửi tặng **Thục Linh** nhân ngày Phụ nữ Việt Nam 20/10.

## Thông tin tác giả & người nhận

| | |
|---|---|
| **Tác giả (Author)** | **Trần Đình Sơn** |
| **Người nhận (Dedicated to)** | **Thục Linh** |
| **Dịp tặng** | Ngày Phụ nữ Việt Nam 20/10 |
| **Loại sản phẩm** | Website tĩnh (HTML / CSS / JavaScript), món quà tinh thần cá nhân hoá |

Toàn bộ ý tưởng, kịch bản, lời chúc, cách sắp xếp ảnh kỷ niệm và việc tích hợp các hiệu ứng trong project này do **Trần Đình Sơn** thực hiện, với mục đích duy nhất là làm một món quà dành riêng cho **Thục Linh**.

Các dấu hiệu nhận diện trong chính sản phẩm:
- Phong thư mở đầu ghi *"Gửi người anh thương — Thục Linh"*, con dấu sáp, thư viết *"Và luôn được yêu thương, Linh nhé."*
- Ảnh kỷ niệm trong trái tim ảnh 3D và bó hoa chính là ảnh của **Thục Linh**.
- Lời chúc ở cảnh hoa hồng viết riêng cho Linh (xem `heart-wish.js`).

> Project này **không phải sản phẩm thương mại** và **không được dùng lại ảnh cá nhân** của Thục Linh cho mục đích khác khi chưa có sự đồng ý của người trong ảnh.

## Chạy local
Giải nén, mở terminal trong thư mục chứa index.html:

    python -m http.server 8000

Mở http://localhost:8000. Có thể dùng VS Code Live Server.
Không mở trực tiếp bằng file:// vì ảnh, model và font cần HTTP.
Website tĩnh, không cần npm hoặc bước build. Cần có mạng để tải Three.js từ CDN (unpkg).

## Các cảnh
Phong thư → hoa bung → trái tim ảnh 3D → hoa hồng 3D và lời chúc → **bó hoa 3D (GLB) với 5 bông hồng bấm được** → trang nền sao.

- Không còn các nút quay lại. Nút con mắt ở góc phải cảnh hoa hồng ẩn/hiện lời chúc.
- Lời chúc hiện từng ký tự, được tạo từ hạt trái tim hồng theo font Great Vibes.
- Nét chữ được raster hóa nguyên dòng để giữ dấu tiếng Việt và nét nối chữ.
- **Trang cuối:** bó hoa hồng 3D đặt giữa màn hình. Bấm vào từng bông hồng, một tấm ảnh (đã bỏ nền) hiện ngay tại bông đó và ở lại tại chỗ. Có thể mở cả 5 ảnh, bấm × để đóng. Kéo chuột ngang để xoay bó hoa.

## File chính
- index.html: giao diện, phong thư, hoa bung, nền sao và điều hướng.
- photo-heart.js: trái tim ảnh 3D và ảnh dọc quanh hông.
- star-rose.js: hoa hồng từ 28.000 hạt theo model, nghiêng 45°, xoay 360°.
- heart-wish.js: lời chúc bằng hạt trái tim, tự căn chữ theo màn hình.
- bouquet.js: cảnh bó hoa 3D, nạp model GLB, cắt nền ảnh và hiển thị ảnh tại bông hoa được bấm.
- assets/photos/: 35 ảnh và photos.json.
- assets/source/: model bó hoa `.glb` (tạo bằng Meshy AI từ ảnh bó hoa) và 5 ảnh cắt sẵn.
- assets/rose-surface.bin, rose-normals.bin: vị trí và hướng bề mặt lấy từ model.
- assets/fonts/: Great Vibes và thông tin giấy phép.
- source-model/rose_scan.glb: model gốc, không cần tải để chạy web.

## Chỉnh sửa
- Sửa lời chúc trong heart-wish.js (message và các mảng lines).
- Sửa nội dung trang tiếp theo trong index.html với class blank-view.
- Căn lại vị trí 5 điểm bấm trên bó hoa: sửa mảng `HOTSPOTS` đầu bouquet.js (nhấn phím **H** để hiện điểm bấm).
- Giữ assets/rose-attribution.txt và ghi công model khi phân phối.

## Ghi công & giấy phép
- **Tác giả website, ý tưởng, lời chúc, tích hợp:** Trần Đình Sơn.
- **Người nhận:** Thục Linh.
- Model "Rose Scan" của Bandit, CC BY 4.0, đã chuyển thể thành hạt và bỏ cuống.
- Model bó hoa GLB được tạo bằng Meshy AI từ ảnh bó hoa tham khảo.
- Thư viện: [Three.js](https://threejs.org/) (MIT). Font: Great Vibes (OFL, xem assets/fonts/).

© Trần Đình Sơn — Made with love for Thục Linh, 20/10.

