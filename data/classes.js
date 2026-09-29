// Nội dung riêng theo lớp (Mầm / Chồi / Lá). Mỗi lớp có bài học + trò chơi + bài luyện câu RIÊNG,
// không dùng chung với lớp khác — app.js chỉ hiển thị phần của lớp đang chọn.
//
//   screens.home / games / sentences: true  → lớp đã có nội dung ở màn đó (các khối có
//       data-class-content="<lớp>" trong index.html hiện ra).
//   screens.*: false → lớp chưa có nội dung ở màn đó, màn hiện thẻ "đang được chuẩn bị" cùng danh
//       sách `upcoming[màn]` (chỉ là chữ giới thiệu, sửa thoải mái).
//
// Khi làm xong nội dung cho 1 màn của 1 lớp: thêm khối data-class-content + code hiển thị rồi đổi
// screens.<màn> → true (và bỏ mục đã làm khỏi `upcoming`).
//   • Lớp Mầm: 12 chủ đề từ vựng, Bảng chữ cái, Ngữ âm, Truyện tranh, các trò chơi, bài luyện câu.
//   • Lớp Chồi: Từ vựng (vocab_choi.js), Ngữ âm 2 (phonics2.js), Từ hay gặp (sight_choi.js), Tập viết chữ, Xếp chữ 3–6 chữ cái,
//     Lật thẻ trí nhớ, Ghép câu (sentences_choi.js).
const CLASS_CONTENT = {
  mam: { screens: { home: true, games: true, sentences: true } },
  choi: {
    screens: { home: true, games: true, sentences: true },
    upcoming: { home: [], games: [], sentences: [] },
    // Tiêu đề + câu giới thiệu ở đầu từng tab khi chọn lớp này (không khai báo = dùng câu gốc của lớp Mầm).
    hero: {
      home: { title: 'Chào ba mẹ! 👋', text: 'Chọn một chủ đề hoặc một nhóm bên dưới để bé học từ và âm mới — chỉ mất khoảng 5 phút thôi ạ.' },
      games: { title: 'Trò chơi 🎮', text: 'Chọn Xếp chữ hoặc Lật thẻ, rồi chọn một chủ đề — chơi lại bao nhiêu lần cũng được!' },
      sentences: { title: 'Ghép câu 🧩', text: 'Bấm các từ theo đúng thứ tự để ghép thành câu hoàn chỉnh nhé!' },
    },
  },
  la: {
    screens: { home: false, games: false, sentences: false },
    upcoming: {
      home: [
        '📖 Đọc hiểu đoạn văn ngắn',
        '💬 Hội thoại 2 lượt',
        '📗 Truyện dài, nhiều câu hỏi',
        '📝 Ngữ pháp cơ bản (am / is / are, has / have)',
      ],
      games: [
        '🔤 Xếp chữ với từ dài',
        '⏱️ Đố nhanh có tính giờ nâng cao',
        '🧩 Sắp xếp câu',
      ],
      sentences: [
        '❓ Hỏi – đáp',
        '🗣️ Đối thoại nhập vai',
        '✍️ Viết câu ngắn',
      ],
    },
  },
};

// Tên gọi từng màn, dùng trong thẻ "đang được chuẩn bị".
const CLASS_SCREEN_LABEL = { home: 'bài học', games: 'trò chơi', sentences: 'bài luyện câu' };
