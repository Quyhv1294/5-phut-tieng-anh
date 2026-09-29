  // Đọc hiểu văn bản thông tin — nội dung RIÊNG của lớp Lá (7–8 tuổi), tab Học. Khác hẳn Truyện
  // (STORY_TOPICS_LA — văn bản KỂ CHUYỆN có nhân vật/diễn biến): đây là văn bản THÔNG TIN thực tế
  // (nội quy, thực đơn, thời khoá biểu) — kỹ năng đọc-tra cứu thay vì đọc-theo-dõi-cốt-truyện. Cùng
  // shape { id, label, emoji, cls, pages:[{emoji,en,vi}], questions:[{q, options:[{emoji,en,vi}],
  // answer}] } và dùng lại NGUYÊN màn đọc/đố của Truyện (xem startStory trong app.js, giờ tìm thêm ở
  // mảng này) — trang đầu luôn là tiêu đề văn bản, các trang sau là từng dòng thông tin.
  const READING_LA_TOPICS = [
    { id: 'reading_rules', label: 'Nội quy lớp học', emoji: '📜', cls: 't-blue',
      pages: [
        { emoji: '📜', en: 'Classroom Rules', vi: 'Nội quy lớp học' },
        { emoji: '✋', en: 'Rule 1: Raise your hand before you speak.', vi: 'Quy tắc 1: Giơ tay trước khi phát biểu.' },
        { emoji: '🤝', en: 'Rule 2: Be kind to your classmates.', vi: 'Quy tắc 2: Tử tế với bạn cùng lớp.' },
        { emoji: '🧹', en: 'Rule 3: Keep your desk clean.', vi: 'Quy tắc 3: Giữ bàn học sạch sẽ.' },
        { emoji: '👂', en: 'Rule 4: Listen when the teacher is talking.', vi: 'Quy tắc 4: Lắng nghe khi cô giáo nói.' },
        { emoji: '🚶', en: "Rule 5: Walk, don't run, in the classroom.", vi: 'Quy tắc 5: Đi bộ, không chạy trong lớp.' },
      ],
      questions: [
        { q: 'Quy tắc 1 nói bé nên làm gì trước khi phát biểu?', options: [
          { emoji: '✋', en: 'Raise your hand', vi: 'Giơ tay' },
          { emoji: '🚶', en: 'Run', vi: 'Chạy' },
          { emoji: '🧹', en: 'Clean the desk', vi: 'Dọn bàn' },
        ], answer: 0 },
        { q: 'Theo quy tắc 3, bé cần giữ gì sạch sẽ?', options: [
          { emoji: '🪑', en: 'Your desk', vi: 'Bàn học' },
          { emoji: '👟', en: 'Your shoes', vi: 'Đôi giày' },
          { emoji: '📚', en: 'The library', vi: 'Thư viện' },
        ], answer: 0 },
        { q: 'Trong lớp học, bé nên đi bộ hay chạy?', options: [
          { emoji: '🚶', en: 'Walk', vi: 'Đi bộ' },
          { emoji: '🏃', en: 'Run', vi: 'Chạy' },
          { emoji: '🧎', en: 'Crawl', vi: 'Bò' },
        ], answer: 0 },
      ] },
    { id: 'reading_menu', label: 'Thực đơn quán ăn', emoji: '🍽️', cls: 't-pink',
      pages: [
        { emoji: '🍽️', en: 'Lucky Restaurant Menu', vi: 'Thực đơn Nhà hàng May Mắn' },
        { emoji: '🍚', en: 'Fried rice: 3 dollars.', vi: 'Cơm chiên: 3 đô la.' },
        { emoji: '🍜', en: 'Noodle soup: 4 dollars.', vi: 'Súp mì: 4 đô la.' },
        { emoji: '🍊', en: 'Orange juice: 2 dollars.', vi: 'Nước cam: 2 đô la.' },
        { emoji: '🍦', en: 'Ice cream: 3 dollars.', vi: 'Kem: 3 đô la.' },
      ],
      questions: [
        { q: 'Súp mì giá bao nhiêu?', options: [
          { emoji: '🍜', en: '4 dollars', vi: '4 đô la' },
          { emoji: '🍚', en: '3 dollars', vi: '3 đô la' },
          { emoji: '🍊', en: '2 dollars', vi: '2 đô la' },
        ], answer: 0 },
        { q: 'Món nào rẻ nhất trong thực đơn?', options: [
          { emoji: '🍊', en: 'Orange juice', vi: 'Nước cam' },
          { emoji: '🍜', en: 'Noodle soup', vi: 'Súp mì' },
          { emoji: '🍦', en: 'Ice cream', vi: 'Kem' },
        ], answer: 0 },
        { q: 'Cơm chiên giá bao nhiêu đô la?', options: [
          { emoji: '🍚', en: '3 dollars', vi: '3 đô la' },
          { emoji: '🍜', en: '4 dollars', vi: '4 đô la' },
          { emoji: '🍦', en: '5 dollars', vi: '5 đô la' },
        ], answer: 0 },
      ] },
    { id: 'reading_schedule', label: 'Lịch học trong tuần', emoji: '🗓️', cls: 't-gold',
      pages: [
        { emoji: '🗓️', en: 'Weekly Class Schedule', vi: 'Lịch học trong tuần' },
        { emoji: '🔢', en: 'Monday: Math and English.', vi: 'Thứ Hai: Toán và Tiếng Anh.' },
        { emoji: '🎨', en: 'Tuesday: Art and Music.', vi: 'Thứ Ba: Mỹ thuật và Âm nhạc.' },
        { emoji: '🔬', en: 'Wednesday: Science and Gym.', vi: 'Thứ Tư: Khoa học và Thể dục.' },
        { emoji: '📖', en: 'Thursday: English and Reading.', vi: 'Thứ Năm: Tiếng Anh và Tập đọc.' },
        { emoji: '⚽', en: 'Friday: Music and Sports Day.', vi: 'Thứ Sáu: Âm nhạc và Ngày Hội thao.' },
      ],
      questions: [
        { q: 'Thứ Ba có những tiết học gì?', options: [
          { emoji: '🎨', en: 'Art and Music', vi: 'Mỹ thuật và Âm nhạc' },
          { emoji: '🔢', en: 'Math and English', vi: 'Toán và Tiếng Anh' },
          { emoji: '🔬', en: 'Science and Gym', vi: 'Khoa học và Thể dục' },
        ], answer: 0 },
        { q: 'Ngày Hội thao (Sports Day) rơi vào thứ mấy?', options: [
          { emoji: '⚽', en: 'Friday', vi: 'Thứ Sáu' },
          { emoji: '🔢', en: 'Monday', vi: 'Thứ Hai' },
          { emoji: '🔬', en: 'Wednesday', vi: 'Thứ Tư' },
        ], answer: 0 },
        { q: 'Thứ Tư có tiết Khoa học và tiết gì nữa?', options: [
          { emoji: '🏃', en: 'Gym', vi: 'Thể dục' },
          { emoji: '🎨', en: 'Art', vi: 'Mỹ thuật' },
          { emoji: '📖', en: 'Reading', vi: 'Tập đọc' },
        ], answer: 0 },
      ] },
  ];
