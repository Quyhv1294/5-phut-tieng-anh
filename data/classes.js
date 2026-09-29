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
//   • Lớp Lá: tab Học xong — Từ vựng (vocab_la.js), Ngữ pháp cơ bản (grammar_la.js, 9 bài), Ngữ âm 3
//     (phonics3.js), Truyện dài (stories_la.js), Cụm từ thông dụng (phrases_la.js), Bài hát
//     (songs_la.js), Đọc hiểu văn bản thông tin (reading_la.js, dùng chung màn Truyện). Tab Trò chơi
//     xong — Xếp chữ từ dài, Đố nhanh nâng cao (5 lựa chọn), Sắp xếp câu (sentences_la.js), Lật thẻ
//     nâng cao (chữ-nghĩa thay vì hình-chữ), Simon nói nâng cao (simon_la.js, lệnh 2 hành động). Tab
//     Câu xong — Hỏi-đáp (qa_la.js, nối câu), Đối thoại nhập vai (dialogues_la.js, chọn lời thoại
//     đúng), Viết câu ngắn (write_la.js, tự gõ câu), Viết đoạn văn ngắn (paragraph_la.js, dùng chung
//     màn Viết câu ngắn — 3 câu nối tiếp/chủ đề).
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
    screens: { home: true, games: true, sentences: true },
    upcoming: { home: [], games: [], sentences: [] },
    // Tiêu đề + câu giới thiệu ở đầu từng tab khi chọn lớp này (không khai báo = dùng câu gốc của lớp Mầm).
    hero: {
      home: { title: 'Chào ba mẹ! 👋', text: 'Chọn Từ vựng, Ngữ pháp, Ngữ âm 3, Truyện, Cụm từ, Bài hát hoặc Đọc hiểu bên dưới để bé học nâng cao hơn nhé.' },
      games: { title: 'Trò chơi 🎮', text: 'Chọn Xếp chữ, Đố nhanh, Sắp xếp câu, Lật thẻ hoặc Simon nói, rồi chọn 1 chủ đề — chơi lại bao nhiêu lần cũng được!' },
      sentences: { title: 'Câu 💬', text: 'Chọn Hỏi-đáp, Đối thoại nhập vai, Viết câu ngắn hoặc Viết đoạn văn, rồi chọn 1 chủ đề để luyện giao tiếp nhé!' },
    },
  },
};

// Tên gọi từng màn, dùng trong thẻ "đang được chuẩn bị".
const CLASS_SCREEN_LABEL = { home: 'bài học', games: 'trò chơi', sentences: 'bài luyện câu' };
