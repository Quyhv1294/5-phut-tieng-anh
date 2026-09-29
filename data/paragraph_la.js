  // Viết đoạn văn ngắn — nội dung RIÊNG của lớp Lá (7–8 tuổi), tab Câu. Nối tiếp "Viết câu ngắn"
  // (write_la.js) nhưng thay vì 5 câu RỜI RẠC không liên quan nhau, mỗi nhóm ở đây là ĐÚNG 3 câu nối
  // tiếp nhau kể về 1 chủ đề — gõ xong cả 3 câu là được cả 1 đoạn văn mini hoàn chỉnh. Dùng lại
  // NGUYÊN cơ chế gõ câu + so khớp nới lỏng của Viết câu ngắn (xem startLaWrite trong app.js, giờ
  // nhận thêm tham số mảng chủ đề) — chỉ thêm khung "đoạn văn của bé" hiện dần từng câu đã gõ đúng.
  const PARAGRAPH_LA_TOPICS = [
    { id: 'para_myday', label: 'Một ngày của con', emoji: '📅', cls: 't-blue',
      sentences: [
        { en: "I wake up at seven o'clock.", vi: 'Con thức dậy lúc 7 giờ.', emoji: '⏰' },
        { en: 'I go to school in the morning.', vi: 'Con đi học vào buổi sáng.', emoji: '🏫' },
        { en: "I go to bed at nine o'clock.", vi: 'Con đi ngủ lúc 9 giờ.', emoji: '🌙' },
      ] },
    { id: 'para_family', label: 'Gia đình con', emoji: '👪', cls: 't-pink',
      sentences: [
        { en: 'I have a mother and a father.', vi: 'Con có mẹ và bố.', emoji: '👪' },
        { en: 'My mother is a teacher.', vi: 'Mẹ con là giáo viên.', emoji: '📚' },
        { en: 'I love my family very much.', vi: 'Con rất yêu gia đình mình.', emoji: '❤️' },
      ] },
    { id: 'para_animal', label: 'Con vật con thích', emoji: '🐶', cls: 't-gold',
      sentences: [
        { en: 'My favorite animal is the dog.', vi: 'Con vật con thích nhất là chó.', emoji: '🐶' },
        { en: 'Dogs are friendly and smart.', vi: 'Chó thân thiện và thông minh.', emoji: '🧠' },
        { en: 'I want to have a dog.', vi: 'Con muốn có một con chó.', emoji: '🐕' },
      ] },
    { id: 'para_weekend', label: 'Cuối tuần của con', emoji: '🎉', cls: 't-mint',
      sentences: [
        { en: 'On Saturday, I play with my friends.', vi: 'Vào thứ Bảy, con chơi với bạn bè.', emoji: '⚽' },
        { en: 'On Sunday, I stay at home with my family.', vi: 'Vào Chủ nhật, con ở nhà với gia đình.', emoji: '🏠' },
        { en: 'I love my weekend.', vi: 'Con thích cuối tuần của mình.', emoji: '🎉' },
      ] },
  ];
