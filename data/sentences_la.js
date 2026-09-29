  // Sắp xếp câu — nội dung RIÊNG của lớp Lá (7–8 tuổi), trò chơi "Sắp xếp câu" trong tab Trò chơi (KHÔNG
  // phải tab Câu — tab Câu của Lá sẽ là Hỏi-đáp/Đối thoại/Viết câu ngắn, khác hẳn cơ chế này). Cùng cơ
  // chế với Ghép câu của lớp Chồi (bấm từ theo đúng thứ tự) nhưng câu dài hơn (5–8 từ, Chồi chỉ 3–4 từ)
  // và mỗi nhóm bám theo đúng 1 cấu trúc ngữ pháp bé vừa học ở Ngữ pháp cơ bản (am/is/are, have/has,
  // số nhiều -s, this/that/these/those, can/can't) để luyện lại ngay trong lúc chơi.
  // en: câu tiếng Anh có dấu chấm cuối (app tự tách từ + bỏ dấu chấm khi làm ô chữ); vi: nghĩa gợi ý.
  const SENTENCE_BUILD_LA_TOPICS = [
    { id: 'sbla_amisare', label: 'Am/Is/Are', emoji: '🔤', cls: 't-blue',
      sentences: [
        { en: 'I am a student at school.', vi: 'Con là một học sinh ở trường.', emoji: '🎒' },
        { en: 'She is reading a new book.', vi: 'Chị ấy đang đọc một quyển sách mới.', emoji: '📖' },
        { en: 'They are playing in the park.', vi: 'Họ đang chơi ở công viên.', emoji: '🏞️' },
        { en: 'We are happy today.', vi: 'Hôm nay chúng con rất vui.', emoji: '😄' },
        { en: 'He is my best friend.', vi: 'Cậu ấy là bạn thân nhất của con.', emoji: '🤝' },
        { en: 'The weather is very hot.', vi: 'Thời tiết hôm nay rất nóng.', emoji: '🥵' },
      ] },
    { id: 'sbla_havehas', label: 'Have/Has', emoji: '🎒', cls: 't-gold',
      sentences: [
        { en: 'I have a new backpack.', vi: 'Con có một chiếc balo mới.', emoji: '🎒' },
        { en: 'My brother has a red bike.', vi: 'Anh con có một chiếc xe đạp đỏ.', emoji: '🚲' },
        { en: 'We have two cats at home.', vi: 'Nhà con có hai con mèo.', emoji: '🐱' },
        { en: 'She has long black hair.', vi: 'Chị ấy có mái tóc đen dài.', emoji: '💇' },
        { en: 'They have a big garden.', vi: 'Họ có một khu vườn lớn.', emoji: '🌳' },
        { en: 'He has a lot of toys.', vi: 'Cậu ấy có rất nhiều đồ chơi.', emoji: '🧸' },
      ] },
    { id: 'sbla_plural', label: 'Số nhiều -s', emoji: '🔢', cls: 't-mint',
      sentences: [
        { en: 'There are five apples in the box.', vi: 'Có năm quả táo trong hộp.', emoji: '🍎' },
        { en: 'The children are playing games.', vi: 'Các bạn nhỏ đang chơi trò chơi.', emoji: '🎲' },
        { en: 'I can see three birds in the tree.', vi: 'Con thấy ba con chim trên cây.', emoji: '🐦' },
        { en: 'She has many books on the shelf.', vi: 'Chị ấy có nhiều sách trên kệ.', emoji: '📚' },
        { en: 'We bought two boxes of pencils.', vi: 'Chúng con đã mua hai hộp bút chì.', emoji: '✏️' },
        { en: 'The dogs are running in the yard.', vi: 'Những chú chó đang chạy trong sân.', emoji: '🐕' },
      ] },
    { id: 'sbla_thisthat', label: 'This/That/These/Those', emoji: '👉', cls: 't-pink',
      sentences: [
        { en: 'This is my favorite toy.', vi: 'Đây là món đồ chơi yêu thích của con.', emoji: '🧸' },
        { en: 'That is a tall building.', vi: 'Kia là một tòa nhà cao.', emoji: '🏢' },
        { en: 'These are my new shoes.', vi: 'Đây là đôi giày mới của con.', emoji: '👟' },
        { en: 'Those are her colorful pencils.', vi: 'Kia là những cây bút chì nhiều màu của chị ấy.', emoji: '🖍️' },
        { en: 'This is a very interesting story.', vi: 'Đây là một câu chuyện rất thú vị.', emoji: '📖' },
        { en: 'Those birds are singing loudly.', vi: 'Những con chim kia đang hót thật to.', emoji: '🐦' },
      ] },
    { id: 'sbla_cancant', label: "Can/Can't", emoji: '💪', cls: 't-accent',
      sentences: [
        { en: 'I can ride a bike very well.', vi: 'Con biết đi xe đạp rất giỏi.', emoji: '🚲' },
        { en: 'She can swim across the pool.', vi: 'Chị ấy có thể bơi qua hồ.', emoji: '🏊' },
        { en: "He can't find his shoes.", vi: 'Cậu ấy không tìm thấy giày của mình.', emoji: '👟' },
        { en: 'We can sing this song together.', vi: 'Chúng con có thể hát bài này cùng nhau.', emoji: '🎤' },
        { en: "They can't come to school today.", vi: 'Hôm nay họ không thể đến trường.', emoji: '🏫' },
        { en: "I can't reach the top shelf.", vi: 'Con không với tới cái kệ trên cao.', emoji: '📚' },
      ] },
  ];
