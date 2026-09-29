  // Từ vựng RIÊNG của lớp Lá (7–8 tuổi, lớp 2), nối tiếp Lớp Chồi: môn học, sở thích, thời gian,
  // mua sắm, sức khỏe. Cùng shape với TOPICS/CHOI_TOPICS ({ en, vi, emoji, example, exampleVi }) nên
  // dùng lại được luồng học (thẻ → đố → hoàn thành). Một vài từ CÓ THỂ trùng khái niệm với Mầm/Chồi
  // (VD "HOT" cũng là từ ngữ âm) — đây là điều bình thường trong dạy ngữ âm/từ vựng thật, không phải lỗi.
  const LA_TOPICS = [
    { id: 'la_school', label: 'Môn học', emoji: '🔢', cls: 't-blue',
      words: [
        { en: 'MATH', vi: 'Toán', emoji: '🔢', example: 'I like MATH class.', exampleVi: 'Con thích tiết Toán.' },
        { en: 'ART', vi: 'Mỹ thuật', emoji: '🎨', example: 'We draw in ART class.', exampleVi: 'Chúng con vẽ trong tiết Mỹ thuật.' },
        { en: 'MUSIC', vi: 'Âm nhạc', emoji: '🎵', example: 'I sing in MUSIC class.', exampleVi: 'Con hát trong tiết Âm nhạc.' },
        { en: 'GYM', vi: 'Thể dục', emoji: '🤸', example: 'We run in GYM class.', exampleVi: 'Chúng con chạy trong tiết Thể dục.' },
        { en: 'SCIENCE', vi: 'Khoa học', emoji: '🔬', example: 'SCIENCE is interesting.', exampleVi: 'Khoa học rất thú vị.' },
        { en: 'ENGLISH', vi: 'Tiếng Anh', emoji: '🔤', example: 'I study ENGLISH every day.', exampleVi: 'Con học Tiếng Anh mỗi ngày.' },
      ] },
    { id: 'la_hobbies', label: 'Sở thích', emoji: '📖', cls: 't-pink',
      words: [
        { en: 'READING', vi: 'Đọc sách', emoji: '📖', example: 'My hobby is READING.', exampleVi: 'Sở thích của con là đọc sách.' },
        { en: 'DRAWING', vi: 'Vẽ tranh', emoji: '🖍️', example: 'I love DRAWING.', exampleVi: 'Con thích vẽ tranh.' },
        { en: 'SINGING', vi: 'Ca hát', emoji: '🎤', example: 'SINGING makes me happy.', exampleVi: 'Ca hát làm con vui.' },
        { en: 'DANCING', vi: 'Nhảy múa', emoji: '💃', example: 'She is good at DANCING.', exampleVi: 'Bạn ấy nhảy múa giỏi.' },
        { en: 'SWIMMING', vi: 'Bơi lội', emoji: '🏊', example: 'SWIMMING is fun in summer.', exampleVi: 'Bơi lội rất vui vào mùa hè.' },
        { en: 'FOOTBALL', vi: 'Bóng đá', emoji: '⚽', example: 'I play FOOTBALL with friends.', exampleVi: 'Con chơi bóng đá cùng các bạn.' },
      ] },
    { id: 'la_time', label: 'Thời gian', emoji: '🌅', cls: 't-gold',
      words: [
        { en: 'MORNING', vi: 'Buổi sáng', emoji: '🌅', example: 'I eat breakfast in the MORNING.', exampleVi: 'Con ăn sáng vào buổi sáng.' },
        { en: 'AFTERNOON', vi: 'Buổi chiều', emoji: '🌇', example: 'We play in the AFTERNOON.', exampleVi: 'Chúng con chơi vào buổi chiều.' },
        { en: 'EVENING', vi: 'Buổi tối', emoji: '🌆', example: 'I eat dinner in the EVENING.', exampleVi: 'Con ăn tối vào buổi tối.' },
        { en: 'NIGHT', vi: 'Ban đêm', emoji: '🌃', example: 'I sleep at NIGHT.', exampleVi: 'Con ngủ vào ban đêm.' },
        { en: 'TODAY', vi: 'Hôm nay', emoji: '📅', example: 'TODAY is Monday.', exampleVi: 'Hôm nay là thứ Hai.' },
        { en: 'TOMORROW', vi: 'Ngày mai', emoji: '🗓️', example: 'TOMORROW is a new day.', exampleVi: 'Ngày mai là một ngày mới.' },
      ] },
    { id: 'la_shopping', label: 'Mua sắm', emoji: '🛒', cls: 't-mint',
      words: [
        { en: 'MONEY', vi: 'Tiền', emoji: '💵', example: 'I save my MONEY.', exampleVi: 'Con tiết kiệm tiền.' },
        { en: 'PRICE', vi: 'Giá tiền', emoji: '🏷️', example: 'The PRICE is five dollars.', exampleVi: 'Giá là năm đô la.' },
        { en: 'BUY', vi: 'Mua', emoji: '🛒', example: 'I want to BUY a toy.', exampleVi: 'Con muốn mua một món đồ chơi.' },
        { en: 'SELL', vi: 'Bán', emoji: '💰', example: 'They SELL fruit here.', exampleVi: 'Họ bán trái cây ở đây.' },
        { en: 'STORE', vi: 'Cửa hàng', emoji: '🏬', example: 'We go to the STORE.', exampleVi: 'Chúng con đi đến cửa hàng.' },
        { en: 'COIN', vi: 'Đồng xu', emoji: '🪙', example: 'I have one COIN.', exampleVi: 'Con có một đồng xu.' },
      ] },
    { id: 'la_health', label: 'Sức khỏe', emoji: '🤒', cls: 't-accent',
      words: [
        { en: 'SICK', vi: 'Bị ốm', emoji: '🤒', example: 'My brother is SICK today.', exampleVi: 'Em con bị ốm hôm nay.' },
        { en: 'MEDICINE', vi: 'Thuốc', emoji: '💊', example: 'I take MEDICINE when I am sick.', exampleVi: 'Con uống thuốc khi bị ốm.' },
        { en: 'EXERCISE', vi: 'Tập thể dục', emoji: '🤸', example: 'I EXERCISE every morning.', exampleVi: 'Con tập thể dục mỗi sáng.' },
        { en: 'REST', vi: 'Nghỉ ngơi', emoji: '🛌', example: 'I need to REST now.', exampleVi: 'Con cần nghỉ ngơi bây giờ.' },
        { en: 'HEALTHY', vi: 'Khỏe mạnh', emoji: '💪', example: 'Vegetables make me HEALTHY.', exampleVi: 'Rau củ giúp con khỏe mạnh.' },
        { en: 'FEVER', vi: 'Sốt', emoji: '🌡️', example: 'I have a FEVER.', exampleVi: 'Con bị sốt.' },
      ] },
  ];
