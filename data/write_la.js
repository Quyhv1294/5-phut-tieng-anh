  // Viết câu ngắn — nội dung RIÊNG của lớp Lá (7–8 tuổi), tab Câu. Khác Sắp xếp câu (chỉ cần BẤM ĐÚNG
  // THỨ TỰ các từ có sẵn) và Ghép câu của Chồi: ở đây bé phải TỰ GÕ cả câu tiếng Anh từ đầu, nhìn nghĩa
  // tiếng Việt + hình gợi ý — luyện nhớ mặt chữ chủ động hơn hẳn, dành cho bé đã quen bàn phím. So khớp
  // câu gõ được nới lỏng (bỏ khác biệt hoa/thường + dấu câu cuối câu, xem checkWriteAnswer trong app.js).
  // Mỗi nhóm 5 câu, câu ngắn 4-6 từ bám theo đúng chủ đề Từ vựng Lớp Lá (vocab_la.js).
  const WRITE_LA_TOPICS = [
    { id: 'write_la_school', label: 'Môn học', emoji: '🔢', cls: 't-blue',
      sentences: [
        { en: 'I like Math class.', vi: 'Con thích tiết Toán.', emoji: '🔢' },
        { en: 'She is good at Art.', vi: 'Bạn ấy giỏi Mỹ thuật.', emoji: '🎨' },
        { en: 'We sing in Music class.', vi: 'Chúng con hát trong tiết Âm nhạc.', emoji: '🎵' },
        { en: 'He studies English every day.', vi: 'Cậu ấy học Tiếng Anh mỗi ngày.', emoji: '🔤' },
        { en: 'Science is very interesting.', vi: 'Khoa học rất thú vị.', emoji: '🔬' },
      ] },
    { id: 'write_la_hobbies', label: 'Sở thích', emoji: '📖', cls: 't-pink',
      sentences: [
        { en: 'My hobby is reading.', vi: 'Sở thích của con là đọc sách.', emoji: '📖' },
        { en: 'I love drawing pictures.', vi: 'Con thích vẽ tranh.', emoji: '🖍️' },
        { en: 'She is good at dancing.', vi: 'Bạn ấy giỏi nhảy múa.', emoji: '💃' },
        { en: 'We play football together.', vi: 'Chúng con chơi bóng đá cùng nhau.', emoji: '⚽' },
        { en: 'Singing makes me happy.', vi: 'Ca hát làm con vui.', emoji: '🎤' },
      ] },
    { id: 'write_la_time', label: 'Thời gian', emoji: '🌅', cls: 't-gold',
      sentences: [
        { en: 'I wake up in the morning.', vi: 'Con thức dậy vào buổi sáng.', emoji: '🌅' },
        { en: 'We eat dinner in the evening.', vi: 'Chúng con ăn tối vào buổi tối.', emoji: '🌆' },
        { en: 'I sleep at night.', vi: 'Con ngủ vào ban đêm.', emoji: '🌃' },
        { en: 'Today is a sunny day.', vi: 'Hôm nay là một ngày nắng.', emoji: '📅' },
        { en: 'Tomorrow is a new day.', vi: 'Ngày mai là một ngày mới.', emoji: '🗓️' },
      ] },
    { id: 'write_la_shopping', label: 'Mua sắm', emoji: '🛒', cls: 't-mint',
      sentences: [
        { en: 'I want to buy a toy.', vi: 'Con muốn mua một món đồ chơi.', emoji: '🛒' },
        { en: 'The price is five dollars.', vi: 'Giá là năm đô la.', emoji: '🏷️' },
        { en: 'I save my money every week.', vi: 'Con tiết kiệm tiền mỗi tuần.', emoji: '💵' },
        { en: 'They sell fruit at the store.', vi: 'Họ bán trái cây ở cửa hàng.', emoji: '🏬' },
        { en: 'I have one coin in my pocket.', vi: 'Con có một đồng xu trong túi.', emoji: '🪙' },
      ] },
    { id: 'write_la_health', label: 'Sức khỏe', emoji: '🤒', cls: 't-accent',
      sentences: [
        { en: 'I feel sick today.', vi: 'Con thấy không khỏe hôm nay.', emoji: '🤒' },
        { en: 'I take medicine when I am sick.', vi: 'Con uống thuốc khi bị ốm.', emoji: '💊' },
        { en: 'I exercise every morning.', vi: 'Con tập thể dục mỗi sáng.', emoji: '🤸' },
        { en: 'Vegetables make me healthy.', vi: 'Rau củ giúp con khỏe mạnh.', emoji: '💪' },
        { en: 'I need to rest now.', vi: 'Con cần nghỉ ngơi bây giờ.', emoji: '🛌' },
      ] },
  ];
