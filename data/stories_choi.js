// Truyện tranh song ngữ RIÊNG của lớp Chồi (5-6 tuổi) — dài và khó hơn STORY_TOPICS của lớp Mầm
// (7 trang thay vì 4-5, 3 câu hỏi thay vì 2, câu ghép dài hơn dùng "and/because"), bám từ vựng
// CHOI_TOPICS (lớp học, thứ trong tuần, hình khối, trong nhà, hành động) để vừa đọc vừa ôn từ đã học.
// Dùng chung màn đọc truyện + đố hiểu truyện với STORY_TOPICS (xem startStory trong app.js — tìm
// theo id trong CẢ HAI mảng), chỉ khác mảng nguồn nên không cần thêm màn/hàm riêng.
const STORY_TOPICS_CHOI = [
  {
    id: 'story_choi_school', label: 'Ngày đầu đến lớp', emoji: '🎒', cls: 't-blue',
    pages: [
      { emoji: '🎒', en: 'Today is my first day at school.', vi: 'Hôm nay là ngày đầu tiên con đi học.' },
      { emoji: '🚌', en: 'I go to school by bus.', vi: 'Con đi học bằng xe buýt.' },
      { emoji: '🏫', en: 'My school is big and colorful.', vi: 'Trường của con to và nhiều màu sắc.' },
      { emoji: '✏️', en: 'I have a pencil, a ruler, and a crayon.', vi: 'Con có một cây bút chì, một cây thước, và một cây bút sáp màu.' },
      { emoji: '🙂', en: 'My teacher is kind and funny.', vi: 'Cô giáo của con hiền và vui tính.' },
      { emoji: '👫', en: 'I make a new friend at school.', vi: 'Con có một người bạn mới ở trường.' },
      { emoji: '🎉', en: 'School is so much fun!', vi: 'Đi học vui ơi là vui!' },
    ],
    questions: [
      { q: 'Bạn nhỏ đi học bằng gì?', options: [
        { emoji: '🚲', en: 'Bike', vi: 'Xe đạp' },
        { emoji: '🚌', en: 'Bus', vi: 'Xe buýt' },
        { emoji: '🚶', en: 'Walk', vi: 'Đi bộ' },
      ], answer: 1 },
      { q: 'Bạn nhỏ có những đồ dùng học tập nào?', options: [
        { emoji: '✏️', en: 'Pencil, ruler, crayon', vi: 'Bút chì, thước, bút sáp màu' },
        { emoji: '⚽', en: 'A ball', vi: 'Quả bóng' },
        { emoji: '☂️', en: 'An umbrella', vi: 'Cái ô' },
      ], answer: 0 },
      { q: 'Cô giáo của bạn nhỏ như thế nào?', options: [
        { emoji: '😠', en: 'Strict', vi: 'Nghiêm khắc' },
        { emoji: '🙂', en: 'Kind and funny', vi: 'Hiền và vui tính' },
        { emoji: '😢', en: 'Sad', vi: 'Buồn' },
      ], answer: 1 },
    ],
  },
  {
    id: 'story_choi_weekend', label: 'Cuối tuần bận rộn', emoji: '📅', cls: 't-gold',
    pages: [
      { emoji: '📅', en: 'On Monday, I go to school.', vi: 'Vào Thứ Hai, con đi học.' },
      { emoji: '🏊', en: 'On Saturday, I swim with my dad.', vi: 'Vào Thứ Bảy, con bơi cùng ba.' },
      { emoji: '🎨', en: 'On Sunday, I like to draw and sing.', vi: 'Vào Chủ Nhật, con thích vẽ và hát.' },
      { emoji: '🚶', en: 'In the evening, we walk in the park.', vi: 'Buổi tối, chúng con đi bộ ở công viên.' },
      { emoji: '💃', en: 'My sister loves to dance.', vi: 'Chị của con thích nhảy múa.' },
      { emoji: '😴', en: 'At night, I sleep early.', vi: 'Buổi tối, con ngủ sớm.' },
      { emoji: '😊', en: 'I love my busy weekend!', vi: 'Con yêu cuối tuần bận rộn của mình!' },
    ],
    questions: [
      { q: 'Bạn nhỏ bơi cùng ai?', options: [
        { emoji: '👩', en: 'Mom', vi: 'Mẹ' },
        { emoji: '👨', en: 'Dad', vi: 'Ba' },
        { emoji: '👧', en: 'Sister', vi: 'Chị gái' },
      ], answer: 1 },
      { q: 'Chị của bạn nhỏ thích làm gì?', options: [
        { emoji: '💃', en: 'Dance', vi: 'Nhảy múa' },
        { emoji: '🏊', en: 'Swim', vi: 'Bơi lội' },
        { emoji: '🎨', en: 'Draw', vi: 'Vẽ tranh' },
      ], answer: 0 },
      { q: 'Bạn nhỏ đi ngủ vào lúc nào?', options: [
        { emoji: '🌅', en: 'Early morning', vi: 'Sáng sớm' },
        { emoji: '☀️', en: 'Noon', vi: 'Buổi trưa' },
        { emoji: '🌙', en: 'Early at night', vi: 'Tối sớm' },
      ], answer: 2 },
    ],
  },
  {
    id: 'story_choi_shapes', label: 'Bữa tiệc hình khối', emoji: '🎨', cls: 't-mint',
    pages: [
      { emoji: '🎨', en: 'Today we make shapes in art class.', vi: 'Hôm nay chúng con làm hình khối ở lớp mỹ thuật.' },
      { emoji: '🔴', en: 'I draw a red circle.', vi: 'Con vẽ một hình tròn màu đỏ.' },
      { emoji: '🟦', en: 'My friend draws a blue square.', vi: 'Bạn của con vẽ một hình vuông màu xanh.' },
      { emoji: '🔺', en: 'We make a yellow triangle together.', vi: 'Chúng con cùng làm một hình tam giác màu vàng.' },
      { emoji: '⭐', en: 'I add a little star on top.', vi: 'Con thêm một ngôi sao nhỏ lên trên.' },
      { emoji: '❤️', en: 'I draw a heart for my mom.', vi: 'Con vẽ một trái tim tặng mẹ.' },
      { emoji: '😊', en: 'Our shape picture is beautiful!', vi: 'Bức tranh hình khối của chúng con thật đẹp!' },
    ],
    questions: [
      { q: 'Bạn nhỏ vẽ hình tròn màu gì?', options: [
        { emoji: '🔵', en: 'Blue', vi: 'Xanh' },
        { emoji: '🔴', en: 'Red', vi: 'Đỏ' },
        { emoji: '🟡', en: 'Yellow', vi: 'Vàng' },
      ], answer: 1 },
      { q: 'Bạn của bạn nhỏ vẽ hình gì?', options: [
        { emoji: '🟦', en: 'Square', vi: 'Hình vuông' },
        { emoji: '🔺', en: 'Triangle', vi: 'Hình tam giác' },
        { emoji: '❤️', en: 'Heart', vi: 'Hình trái tim' },
      ], answer: 0 },
      { q: 'Bạn nhỏ vẽ trái tim tặng ai?', options: [
        { emoji: '👨', en: 'Dad', vi: 'Ba' },
        { emoji: '👩', en: 'Mom', vi: 'Mẹ' },
        { emoji: '🙂', en: 'Teacher', vi: 'Cô giáo' },
      ], answer: 1 },
    ],
  },
  {
    id: 'story_choi_house', label: 'Dọn nhà cùng gia đình', emoji: '🏠', cls: 't-accent',
    pages: [
      { emoji: '🏠', en: 'This is my house.', vi: 'Đây là nhà của con.' },
      { emoji: '🍳', en: 'Mom cooks in the kitchen.', vi: 'Mẹ nấu ăn trong bếp.' },
      { emoji: '🛏️', en: 'I clean my bedroom.', vi: 'Con dọn dẹp phòng ngủ của mình.' },
      { emoji: '🛋️', en: 'Dad reads on the sofa.', vi: 'Ba đọc sách trên ghế sofa.' },
      { emoji: '🪟', en: 'I open the window because it is hot.', vi: 'Con mở cửa sổ vì trời nóng.' },
      { emoji: '🌳', en: 'We water the plants in the garden.', vi: 'Chúng con tưới cây trong vườn.' },
      { emoji: '😊', en: 'Our house is clean and happy.', vi: 'Nhà của chúng con sạch sẽ và vui vẻ.' },
    ],
    questions: [
      { q: 'Mẹ nấu ăn ở đâu?', options: [
        { emoji: '🛏️', en: 'Bedroom', vi: 'Phòng ngủ' },
        { emoji: '🍳', en: 'Kitchen', vi: 'Nhà bếp' },
        { emoji: '🛁', en: 'Bathroom', vi: 'Phòng tắm' },
      ], answer: 1 },
      { q: 'Ba làm gì trên ghế sofa?', options: [
        { emoji: '😴', en: 'Sleep', vi: 'Ngủ' },
        { emoji: '📖', en: 'Read', vi: 'Đọc sách' },
        { emoji: '🍽️', en: 'Eat', vi: 'Ăn cơm' },
      ], answer: 1 },
      { q: 'Vì sao bạn nhỏ mở cửa sổ?', options: [
        { emoji: '🥵', en: 'Because it is hot', vi: 'Vì trời nóng' },
        { emoji: '🌧️', en: 'Because it is raining', vi: 'Vì trời mưa' },
        { emoji: '🌙', en: 'Because it is dark', vi: 'Vì trời tối' },
      ], answer: 0 },
    ],
  },
];
