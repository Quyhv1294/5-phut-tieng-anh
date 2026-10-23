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
  {
    id: 'story_la_mid_autumn', label: 'Đêm Trung thu của Na và Bo', emoji: '🏮', cls: 't-gold',
    pages: [
      { emoji: '🌕', en: 'Tonight is the Mid-Autumn Festival.', vi: 'Tối nay là Tết Trung thu.' },
      { emoji: '🏮', en: 'In the afternoon, Na and Bo make lanterns.', vi: 'Vào buổi chiều, Na và Bo làm đèn lồng.' },
      { emoji: '🎨', en: 'Na paints her lantern red and gold.', vi: 'Na tô đèn lồng của mình màu đỏ và vàng.' },
      { emoji: '🥮', en: 'Bo\'s mom makes a big mooncake.', vi: 'Mẹ của Bo làm một chiếc bánh trung thu to.' },
      { emoji: '🌙', en: 'In the evening, the moon is round and bright.', vi: 'Buổi tối, mặt trăng tròn và sáng.' },
      { emoji: '🚶', en: 'The children walk in the street with their lanterns.', vi: 'Các bạn nhỏ rước đèn đi trên phố.' },
      { emoji: '🦁', en: 'Then they watch the lion dance.', vi: 'Rồi các bạn xem múa lân.' },
      { emoji: '😋', en: 'Na and Bo share the mooncake.', vi: 'Na và Bo chia nhau bánh trung thu.' },
      { emoji: '🥰', en: 'It is a happy night!', vi: 'Thật là một đêm vui!' },
    ],
    questions: [
      { q: 'Vào buổi chiều Na và Bo làm gì?', options: [
        { emoji: '🏊', en: 'Swim', vi: 'Đi bơi' },
        { emoji: '🏮', en: 'Make lanterns', vi: 'Làm đèn lồng' },
        { emoji: '📚', en: 'Read books', vi: 'Đọc sách' },
      ], answer: 1 },
      { q: 'Na tô đèn lồng màu gì?', options: [
        { emoji: '🔵', en: 'Blue and green', vi: 'Xanh dương và xanh lá' },
        { emoji: '⚫', en: 'Black and white', vi: 'Đen và trắng' },
        { emoji: '🔴', en: 'Red and gold', vi: 'Đỏ và vàng' },
      ], answer: 2 },
      { q: 'Các bạn nhỏ xem gì trên phố?', options: [
        { emoji: '🦁', en: 'Lion dance', vi: 'Múa lân' },
        { emoji: '🎆', en: 'Fireworks', vi: 'Pháo hoa' },
        { emoji: '🎬', en: 'A movie', vi: 'Một bộ phim' },
      ], answer: 0 },
      { q: 'Na và Bo chia nhau món gì?', options: [
        { emoji: '🍕', en: 'Pizza', vi: 'Bánh pizza' },
        { emoji: '🥮', en: 'Mooncake', vi: 'Bánh trung thu' },
        { emoji: '🍪', en: 'Cookie', vi: 'Bánh quy' },
      ], answer: 1 },
    ],
  },
  {
    id: 'story_la_healthy_day', label: 'Một ngày khỏe mạnh', emoji: '💪', cls: 't-mint',
    pages: [
      { emoji: '⏰', en: 'Na wakes up early in the morning.', vi: 'Na thức dậy sớm vào buổi sáng.' },
      { emoji: '🥛', en: 'For breakfast, Na eats an egg and drinks milk.', vi: 'Bữa sáng, Na ăn một quả trứng và uống sữa.' },
      { emoji: '🏃', en: 'After breakfast, Na goes running with Bo.', vi: 'Sau bữa sáng, Na đi chạy bộ cùng Bo.' },
      { emoji: '🥗', en: 'At lunch, they eat a big salad.', vi: 'Bữa trưa, hai bạn ăn một đĩa salad to.' },
      { emoji: '⚽', en: 'In the afternoon, they play football.', vi: 'Buổi chiều, hai bạn chơi bóng đá.' },
      { emoji: '💧', en: 'They drink a lot of water.', vi: 'Hai bạn uống thật nhiều nước.' },
      { emoji: '🍲', en: 'For dinner, they eat chicken soup.', vi: 'Bữa tối, hai bạn ăn súp gà.' },
      { emoji: '🪥', en: 'At night, they brush their teeth.', vi: 'Buổi tối, hai bạn đánh răng.' },
      { emoji: '😴', en: 'Healthy kids sleep early!', vi: 'Những bạn nhỏ khỏe mạnh đi ngủ sớm!' },
    ],
    questions: [
      { q: 'Bữa sáng Na ăn và uống gì?', options: [
        { emoji: '🥛', en: 'An egg and milk', vi: 'Một quả trứng và sữa' },
        { emoji: '🍕', en: 'Pizza and juice', vi: 'Pizza và nước ép' },
        { emoji: '🍪', en: 'Cookies and tea', vi: 'Bánh quy và trà' },
      ], answer: 0 },
      { q: 'Sau bữa sáng Na làm gì cùng Bo?', options: [
        { emoji: '📺', en: 'Watch TV', vi: 'Xem ti vi' },
        { emoji: '🏃', en: 'Go running', vi: 'Đi chạy bộ' },
        { emoji: '😴', en: 'Sleep', vi: 'Đi ngủ' },
      ], answer: 1 },
      { q: 'Bữa tối hai bạn ăn gì?', options: [
        { emoji: '🥗', en: 'A big salad', vi: 'Salad to' },
        { emoji: '🥪', en: 'A sandwich', vi: 'Bánh sandwich' },
        { emoji: '🍲', en: 'Chicken soup', vi: 'Súp gà' },
      ], answer: 2 },
      { q: 'Buổi tối trước khi ngủ hai bạn làm gì?', options: [
        { emoji: '🪥', en: 'Brush their teeth', vi: 'Đánh răng' },
        { emoji: '⚽', en: 'Play football', vi: 'Chơi bóng đá' },
        { emoji: '🛍️', en: 'Go shopping', vi: 'Đi mua sắm' },
      ], answer: 0 },
    ],
  },
  {
    id: 'story_la_city_trip', label: 'Chuyến đi vào thành phố', emoji: '🏙️', cls: 't-blue',
    pages: [
      { emoji: '🚌', en: 'On Saturday, Na and Bo take a bus to the city.', vi: 'Vào Thứ Bảy, Na và Bo đi xe buýt vào thành phố.' },
      { emoji: '🌉', en: 'The bus crosses a long bridge.', vi: 'Xe buýt đi qua một cây cầu dài.' },
      { emoji: '🏙️', en: 'The city has many tall buildings.', vi: 'Thành phố có nhiều tòa nhà cao.' },
      { emoji: '🛒', en: 'First, they go to the supermarket.', vi: 'Đầu tiên, hai bạn đến siêu thị.' },
      { emoji: '🎬', en: 'Then, they watch a movie at the cinema.', vi: 'Sau đó, hai bạn xem phim ở rạp chiếu phim.' },
      { emoji: '🍕', en: 'After the movie, they eat pizza.', vi: 'Sau bộ phim, hai bạn ăn pizza.' },
      { emoji: '🏟️', en: 'On the way home, they see a big stadium.', vi: 'Trên đường về, hai bạn thấy một sân vận động lớn.' },
      { emoji: '🌇', en: 'In the evening, they take the bus home.', vi: 'Buổi tối, hai bạn đi xe buýt về nhà.' },
      { emoji: '😊', en: 'It is a great day in the city!', vi: 'Một ngày thật tuyệt ở thành phố!' },
    ],
    questions: [
      { q: 'Na và Bo vào thành phố bằng gì?', options: [
        { emoji: '🚆', en: 'Train', vi: 'Tàu hỏa' },
        { emoji: '✈️', en: 'Plane', vi: 'Máy bay' },
        { emoji: '🚌', en: 'Bus', vi: 'Xe buýt' },
      ], answer: 2 },
      { q: 'Hai bạn đến đâu đầu tiên?', options: [
        { emoji: '🛒', en: 'Supermarket', vi: 'Siêu thị' },
        { emoji: '🎬', en: 'Cinema', vi: 'Rạp chiếu phim' },
        { emoji: '🏦', en: 'Bank', vi: 'Ngân hàng' },
      ], answer: 0 },
      { q: 'Hai bạn xem phim ở đâu?', options: [
        { emoji: '🏨', en: 'Hotel', vi: 'Khách sạn' },
        { emoji: '🎬', en: 'Cinema', vi: 'Rạp chiếu phim' },
        { emoji: '🏟️', en: 'Stadium', vi: 'Sân vận động' },
      ], answer: 1 },
      { q: 'Sau khi xem phim hai bạn ăn gì?', options: [
        { emoji: '🥗', en: 'Salad', vi: 'Salad' },
        { emoji: '🍪', en: 'Cookie', vi: 'Bánh quy' },
        { emoji: '🍕', en: 'Pizza', vi: 'Bánh pizza' },
      ], answer: 2 },
    ],
  },
];
