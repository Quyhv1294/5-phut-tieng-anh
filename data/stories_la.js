// Truyện tranh song ngữ RIÊNG của lớp Lá (7-8 tuổi) — dài và khó hơn cả STORY_TOPICS_CHOI (9 trang,
// 4 câu hỏi thay vì 7 trang/3 câu), câu văn dùng nhiều thì/ngữ pháp hơn (am/is/are, have/has, can/can't)
// và từ vựng LA_TOPICS (môn học, sở thích, thời gian, mua sắm, sức khỏe) để vừa đọc vừa ôn lại.
// Dùng chung màn đọc truyện + đố hiểu truyện với STORY_TOPICS/STORY_TOPICS_CHOI (xem startStory trong
// app.js — tìm theo id trong CẢ 3 mảng), chỉ khác mảng nguồn nên không cần thêm màn/hàm riêng.
const STORY_TOPICS_LA = [
  {
    id: 'story_la_school_day', label: 'Một ngày ở trường', emoji: '🏫', cls: 't-blue',
    pages: [
      { emoji: '📅', en: 'Today is Monday, and I am happy.', vi: 'Hôm nay là thứ Hai, và con rất vui.' },
      { emoji: '🔢', en: 'In the morning, I have Math class.', vi: 'Vào buổi sáng, con có tiết Toán.' },
      { emoji: '🤔', en: 'Math is a little hard, but I try my best.', vi: 'Toán hơi khó, nhưng con cố gắng hết sức.' },
      { emoji: '🎨', en: 'After Math, we have Art class.', vi: 'Sau tiết Toán, chúng con có tiết Mỹ thuật.' },
      { emoji: '🖍️', en: 'I like Art because I can draw pictures.', vi: 'Con thích Mỹ thuật vì con được vẽ tranh.' },
      { emoji: '🍱', en: 'At noon, I eat lunch with my friends.', vi: 'Buổi trưa, con ăn trưa cùng các bạn.' },
      { emoji: '🎵', en: 'In the afternoon, we have Music class.', vi: 'Buổi chiều, chúng con có tiết Âm nhạc.' },
      { emoji: '🎤', en: 'We sing songs together and it is so much fun.', vi: 'Chúng con cùng hát và rất vui.' },
      { emoji: '😊', en: 'I love my school day!', vi: 'Con yêu ngày đi học của mình!' },
    ],
    questions: [
      { q: 'Vào buổi sáng bạn nhỏ có tiết học gì?', options: [
        { emoji: '🎨', en: 'Art', vi: 'Mỹ thuật' },
        { emoji: '🔢', en: 'Math', vi: 'Toán' },
        { emoji: '🎵', en: 'Music', vi: 'Âm nhạc' },
      ], answer: 1 },
      { q: 'Vì sao bạn nhỏ thích tiết Mỹ thuật?', options: [
        { emoji: '🖍️', en: 'Draw pictures', vi: 'Được vẽ tranh' },
        { emoji: '🎤', en: 'Sing songs', vi: 'Được hát' },
        { emoji: '⚽', en: 'Play football', vi: 'Được chơi bóng' },
      ], answer: 0 },
      { q: 'Bạn nhỏ ăn trưa cùng ai?', options: [
        { emoji: '🙂', en: 'Teacher', vi: 'Cô giáo' },
        { emoji: '👪', en: 'Family', vi: 'Gia đình' },
        { emoji: '👫', en: 'Friends', vi: 'Các bạn' },
      ], answer: 2 },
      { q: 'Buổi chiều bạn nhỏ có tiết học gì?', options: [
        { emoji: '🔬', en: 'Science', vi: 'Khoa học' },
        { emoji: '🎵', en: 'Music', vi: 'Âm nhạc' },
        { emoji: '🤸', en: 'Gym', vi: 'Thể dục' },
      ], answer: 1 },
    ],
  },
  {
    id: 'story_la_weekend_hobby', label: 'Sở thích cuối tuần', emoji: '📖', cls: 't-pink',
    pages: [
      { emoji: '🏠', en: 'It is Saturday, and I am at home.', vi: 'Hôm nay là thứ Bảy, và con đang ở nhà.' },
      { emoji: '📖', en: 'My hobby is reading. I have many books.', vi: 'Sở thích của con là đọc sách. Con có nhiều sách.' },
      { emoji: '🖍️', en: "My sister's hobby is drawing. She has many crayons.", vi: 'Sở thích của chị con là vẽ. Chị ấy có nhiều bút sáp màu.' },
      { emoji: '🌳', en: 'In the afternoon, we go to the park.', vi: 'Buổi chiều, chúng con đi công viên.' },
      { emoji: '⚽', en: 'My brother likes football. He can run very fast.', vi: 'Anh con thích bóng đá. Anh ấy chạy rất nhanh.' },
      { emoji: '🏊', en: "I can't play football well, but I can swim.", vi: 'Con không chơi bóng đá giỏi, nhưng con biết bơi.' },
      { emoji: '😴', en: 'In the evening, we are tired but happy.', vi: 'Buổi tối, chúng con mệt nhưng vui.' },
      { emoji: '🍽️', en: 'We eat dinner together and talk about our day.', vi: 'Chúng con ăn tối cùng nhau và kể về ngày hôm đó.' },
      { emoji: '❤️', en: 'I love weekends with my family!', vi: 'Con yêu những ngày cuối tuần cùng gia đình!' },
    ],
    questions: [
      { q: 'Sở thích của bạn nhỏ là gì?', options: [
        { emoji: '🖍️', en: 'Drawing', vi: 'Vẽ tranh' },
        { emoji: '📖', en: 'Reading', vi: 'Đọc sách' },
        { emoji: '⚽', en: 'Football', vi: 'Chơi bóng đá' },
      ], answer: 1 },
      { q: 'Sở thích của chị bạn nhỏ là gì?', options: [
        { emoji: '📖', en: 'Reading', vi: 'Đọc sách' },
        { emoji: '🖍️', en: 'Drawing', vi: 'Vẽ tranh' },
        { emoji: '🏊', en: 'Swimming', vi: 'Bơi lội' },
      ], answer: 1 },
      { q: 'Bạn nhỏ giỏi môn gì?', options: [
        { emoji: '⚽', en: 'Football', vi: 'Bóng đá' },
        { emoji: '🏊', en: 'Swimming', vi: 'Bơi lội' },
        { emoji: '🖍️', en: 'Drawing', vi: 'Vẽ tranh' },
      ], answer: 1 },
      { q: 'Buổi tối cả nhà cùng làm gì?', options: [
        { emoji: '🎬', en: 'Watch a movie', vi: 'Xem phim' },
        { emoji: '🍽️', en: 'Eat dinner together', vi: 'Ăn tối cùng nhau' },
        { emoji: '😴', en: 'Sleep early', vi: 'Đi ngủ sớm' },
      ], answer: 1 },
    ],
  },
  {
    id: 'story_la_shopping_day', label: 'Đi mua sắm', emoji: '🛒', cls: 't-gold',
    pages: [
      { emoji: '🏬', en: 'Today, I go to the store with my mom.', vi: 'Hôm nay, con đi đến cửa hàng cùng mẹ.' },
      { emoji: '💵', en: 'I have some money in my pocket.', vi: 'Con có một ít tiền trong túi.' },
      { emoji: '🧸', en: 'I see a nice toy. The price is five dollars.', vi: 'Con thấy một món đồ chơi đẹp. Giá là năm đô la.' },
      { emoji: '❓', en: '"Can I buy this toy?" I ask my mom.', vi: '"Con mua món đồ chơi này được không ạ?" con hỏi mẹ.' },
      { emoji: '✅', en: '"Yes, you can," my mom says.', vi: '"Được con," mẹ nói.' },
      { emoji: '🪙', en: 'I am so excited! I give the coin to the seller.', vi: 'Con hào hứng quá! Con đưa đồng xu cho người bán.' },
      { emoji: '💊', en: 'My mom buys some medicine because my brother is sick.', vi: 'Mẹ mua một ít thuốc vì em con bị ốm.' },
      { emoji: '🏠', en: 'We go home and I play with my new toy.', vi: 'Chúng con về nhà và con chơi với món đồ chơi mới.' },
      { emoji: '😆', en: 'It is a fun shopping day!', vi: 'Đó là một ngày mua sắm thật vui!' },
    ],
    questions: [
      { q: 'Bạn nhỏ đi mua sắm cùng ai?', options: [
        { emoji: '👨', en: 'Dad', vi: 'Ba' },
        { emoji: '👩', en: 'Mom', vi: 'Mẹ' },
        { emoji: '👧', en: 'Sister', vi: 'Chị' },
      ], answer: 1 },
      { q: 'Giá món đồ chơi là bao nhiêu?', options: [
        { emoji: '3️⃣', en: 'Three dollars', vi: 'Ba đô la' },
        { emoji: '5️⃣', en: 'Five dollars', vi: 'Năm đô la' },
        { emoji: '🔟', en: 'Ten dollars', vi: 'Mười đô la' },
      ], answer: 1 },
      { q: 'Vì sao mẹ mua thuốc?', options: [
        { emoji: '👩', en: 'Mom is sick', vi: 'Vì mẹ bị ốm' },
        { emoji: '👶', en: 'Brother is sick', vi: 'Vì em bị ốm' },
        { emoji: '👨', en: 'Dad is sick', vi: 'Vì ba bị ốm' },
      ], answer: 1 },
      { q: 'Bạn nhỏ cảm thấy thế nào khi mua được đồ chơi?', options: [
        { emoji: '😢', en: 'Sad', vi: 'Buồn' },
        { emoji: '🤩', en: 'Excited', vi: 'Hào hứng' },
        { emoji: '😱', en: 'Scared', vi: 'Sợ hãi' },
      ], answer: 1 },
    ],
  },
];
