// Truyện tranh song ngữ ngắn — mỗi truyện 4-5 trang (emoji + câu tiếng Anh + nghĩa tiếng Việt),
// đọc xong làm 2 câu hỏi hiểu truyện bằng tiếng Việt. Mỗi đáp án kèm icon + từ tiếng Anh + nghĩa
// tiếng Việt (không phải chỉ chữ tiếng Việt) để bé vừa ôn từ vựng vừa trả lời câu hỏi. Cùng nguyên
// tắc với ABC_TOPICS/PHONICS_TOPICS (data/alphabet.js, data/phonics.js): tách khỏi TOPICS nên không
// đụng khoá tuần tự/huy hiệu/mảnh ghép tranh, chỉ đánh dấu progress.doneTopics theo id riêng.
const STORY_TOPICS = [
  {
    id: 'story_zoo', label: 'Đi sở thú', emoji: '🦁', cls: 't-mint',
    pages: [
      { emoji: '🧒', en: 'This is me.', vi: 'Đây là tôi.' },
      { emoji: '🚗', en: 'I go to the zoo.', vi: 'Tôi đi đến sở thú.' },
      { emoji: '🦁', en: 'I see a big lion.', vi: 'Tôi nhìn thấy một con sư tử to.' },
      { emoji: '🐘', en: 'I see a gray elephant.', vi: 'Tôi nhìn thấy một con voi màu xám.' },
      { emoji: '😊', en: 'What a fun day!', vi: 'Một ngày thật vui!' },
    ],
    questions: [
      { q: 'Bạn nhỏ đi đến đâu?', options: [
        { emoji: '🏫', en: 'School', vi: 'Trường học' },
        { emoji: '🦁', en: 'Zoo', vi: 'Sở thú' },
        { emoji: '🌳', en: 'Park', vi: 'Công viên' },
      ], answer: 1 },
      { q: 'Con vật nào to lớn xuất hiện trong truyện?', options: [
        { emoji: '🐈', en: 'Cat', vi: 'Con mèo' },
        { emoji: '🦁', en: 'Lion', vi: 'Con sư tử' },
        { emoji: '🐕', en: 'Dog', vi: 'Con chó' },
      ], answer: 1 },
    ],
  },
  {
    id: 'story_birthday', label: 'Sinh nhật vui vẻ', emoji: '🍰', cls: 't-pink',
    pages: [
      { emoji: '🧒', en: 'Today is my birthday.', vi: 'Hôm nay là sinh nhật của tôi.' },
      { emoji: '🎈', en: 'I have balloons.', vi: 'Tôi có những quả bóng bay.' },
      { emoji: '🎁', en: 'My friends bring gifts.', vi: 'Các bạn mang quà đến tặng tôi.' },
      { emoji: '🍰', en: 'We eat cake together.', vi: 'Chúng tôi cùng nhau ăn bánh.' },
      { emoji: '😊', en: 'It is a happy day.', vi: 'Đó là một ngày thật vui.' },
    ],
    questions: [
      { q: 'Hôm nay là ngày gì?', options: [
        { emoji: '🎂', en: 'Birthday', vi: 'Sinh nhật' },
        { emoji: '🎄', en: 'Christmas', vi: 'Giáng sinh' },
        { emoji: '🎉', en: 'Party', vi: 'Tiệc' },
      ], answer: 0 },
      { q: 'Bạn nhỏ và các bạn cùng ăn gì?', options: [
        { emoji: '🍭', en: 'Candy', vi: 'Kẹo' },
        { emoji: '🍰', en: 'Cake', vi: 'Bánh' },
        { emoji: '🍞', en: 'Bread', vi: 'Bánh mì' },
      ], answer: 1 },
    ],
  },
  {
    id: 'story_rain', label: 'Ngày mưa', emoji: '🌈', cls: 't-blue',
    pages: [
      { emoji: '🌧️', en: 'It is raining today.', vi: 'Hôm nay trời đang mưa.' },
      { emoji: '☂️', en: 'I take my umbrella.', vi: 'Tôi mang theo chiếc ô của mình.' },
      { emoji: '🌈', en: 'After the rain, I see a rainbow.', vi: 'Sau cơn mưa, tôi nhìn thấy cầu vồng.' },
      { emoji: '😊', en: 'The rainbow is so pretty.', vi: 'Cầu vồng thật đẹp.' },
    ],
    questions: [
      { q: 'Bạn nhỏ mang theo gì khi trời mưa?', options: [
        { emoji: '🎈', en: 'Balloon', vi: 'Bóng bay' },
        { emoji: '☂️', en: 'Umbrella', vi: 'Ô (dù)' },
        { emoji: '☀️', en: 'Sun', vi: 'Mặt trời' },
      ], answer: 1 },
      { q: 'Sau cơn mưa, bạn nhỏ nhìn thấy gì?', options: [
        { emoji: '☀️', en: 'Sun', vi: 'Mặt trời' },
        { emoji: '🌈', en: 'Rainbow', vi: 'Cầu vồng' },
        { emoji: '⭐', en: 'Star', vi: 'Ngôi sao' },
      ], answer: 1 },
    ],
  },
  {
    id: 'story_farm', label: 'Thăm trang trại', emoji: '🐄', cls: 't-gold',
    pages: [
      { emoji: '🚜', en: 'We visit a farm.', vi: 'Chúng tôi đến thăm một trang trại.' },
      { emoji: '🐄', en: 'The cow says moo.', vi: 'Con bò kêu moo.' },
      { emoji: '🐔', en: 'The chicken says cluck.', vi: 'Con gà kêu cục tác.' },
      { emoji: '🐖', en: 'The pig says oink.', vi: 'Con lợn kêu ụt ịt.' },
      { emoji: '😊', en: 'I love the farm.', vi: 'Tôi yêu trang trại này.' },
    ],
    questions: [
      { q: 'Chúng tôi đến thăm nơi nào?', options: [
        { emoji: '🚜', en: 'Farm', vi: 'Trang trại' },
        { emoji: '🏫', en: 'School', vi: 'Trường học' },
        { emoji: '🦁', en: 'Zoo', vi: 'Sở thú' },
      ], answer: 0 },
      { q: 'Con bò kêu tiếng gì?', options: [
        { emoji: '🐔', en: 'Cluck', vi: 'Cục tác' },
        { emoji: '🐄', en: 'Moo', vi: 'Moo' },
        { emoji: '🐖', en: 'Oink', vi: 'Ụt ịt' },
      ], answer: 1 },
    ],
  },
  {
    id: 'story_na_bo_picnic', label: 'Na và Bo đi dã ngoại', emoji: '🧺', cls: 't-gold',
    pages: [
      { emoji: '🦊', en: 'This is Na.', vi: 'Đây là Na.' },
      { emoji: '🐰', en: 'This is Bo. Bo is my friend.', vi: 'Đây là Bo. Bo là bạn của Na.' },
      { emoji: '🌳', en: 'We go to the park.', vi: 'Chúng mình đi công viên.' },
      { emoji: '🍎', en: 'We eat an apple and bread.', vi: 'Chúng mình ăn một quả táo và bánh mì.' },
      { emoji: '😊', en: 'We are happy!', vi: 'Chúng mình thật vui!' },
    ],
    questions: [
      { q: 'Bạn của Na là ai?', options: [
        { emoji: '🐰', en: 'Rabbit', vi: 'Con thỏ' },
        { emoji: '🐶', en: 'Dog', vi: 'Con chó' },
        { emoji: '🐱', en: 'Cat', vi: 'Con mèo' },
      ], answer: 0 },
      { q: 'Hai bạn ăn gì?', options: [
        { emoji: '🐟', en: 'Fish and milk', vi: 'Cá và sữa' },
        { emoji: '🍎', en: 'Apple and bread', vi: 'Táo và bánh mì' },
        { emoji: '🍰', en: 'Cake and juice', vi: 'Bánh kem và nước ép' },
      ], answer: 1 },
    ],
  },
  {
    id: 'story_na_colors', label: 'Na tô màu', emoji: '🎨', cls: 't-mint',
    pages: [
      { emoji: '🦊', en: 'Na likes colors.', vi: 'Na thích các màu sắc.' },
      { emoji: '🍎', en: 'Red is an apple.', vi: 'Màu đỏ là quả táo.' },
      { emoji: '☀️', en: 'Yellow is the sun.', vi: 'Màu vàng là mặt trời.' },
      { emoji: '🐟', en: 'Blue is a fish.', vi: 'Màu xanh dương là con cá.' },
      { emoji: '🌈', en: 'Look! A rainbow!', vi: 'Nhìn kìa! Cầu vồng!' },
    ],
    questions: [
      { q: 'Mặt trời có màu gì?', options: [
        { emoji: '🟡', en: 'Yellow', vi: 'Màu vàng' },
        { emoji: '🔴', en: 'Red', vi: 'Màu đỏ' },
        { emoji: '🔵', en: 'Blue', vi: 'Màu xanh dương' },
      ], answer: 0 },
      { q: 'Cuối truyện Na nhìn thấy gì?', options: [
        { emoji: '🌧️', en: 'Rain', vi: 'Cơn mưa' },
        { emoji: '🌈', en: 'Rainbow', vi: 'Cầu vồng' },
        { emoji: '☁️', en: 'Cloud', vi: 'Đám mây' },
      ], answer: 1 },
    ],
  },
  {
    id: 'story_na_body', label: 'Na biết nhảy múa', emoji: '💃', cls: 't-pink',
    pages: [
      { emoji: '🦊', en: 'Na has two eyes.', vi: 'Na có hai con mắt.' },
      { emoji: '👃', en: 'Na has one nose.', vi: 'Na có một cái mũi.' },
      { emoji: '👏', en: 'Na has two hands. Clap, clap!', vi: 'Na có hai bàn tay. Vỗ tay nào!' },
      { emoji: '🦶', en: 'Na has two feet. Jump, jump!', vi: 'Na có hai bàn chân. Nhảy lên nào!' },
      { emoji: '😄', en: 'Na loves to play!', vi: 'Na rất thích chơi!' },
    ],
    questions: [
      { q: 'Na có mấy con mắt?', options: [
        { emoji: '2️⃣', en: 'Two', vi: 'Hai' },
        { emoji: '1️⃣', en: 'One', vi: 'Một' },
        { emoji: '3️⃣', en: 'Three', vi: 'Ba' },
      ], answer: 0 },
      { q: 'Na làm gì với đôi tay?', options: [
        { emoji: '😴', en: 'Sleep', vi: 'Ngủ' },
        { emoji: '👏', en: 'Clap', vi: 'Vỗ tay' },
        { emoji: '🍽️', en: 'Eat', vi: 'Ăn' },
      ], answer: 1 },
    ],
  },
  {
    id: 'story_bo_toys', label: 'Đồ chơi của Bo', emoji: '🧸', cls: 't-blue',
    pages: [
      { emoji: '🐰', en: 'Bo has a big bag.', vi: 'Bo có một chiếc túi to.' },
      { emoji: '🧸', en: 'Bo has a bear.', vi: 'Bo có một chú gấu bông.' },
      { emoji: '🪁', en: 'Bo has a kite.', vi: 'Bo có một chiếc diều.' },
      { emoji: '🚗', en: 'Bo has a red car.', vi: 'Bo có một chiếc xe màu đỏ.' },
      { emoji: '🎁', en: 'Bo gives a gift to Na. Thank you, Bo!', vi: 'Bo tặng quà cho Na. Cảm ơn Bo!' },
    ],
    questions: [
      { q: 'Bo tặng quà cho ai?', options: [
        { emoji: '🐶', en: 'Dog', vi: 'Con chó' },
        { emoji: '🐱', en: 'Cat', vi: 'Con mèo' },
        { emoji: '🦊', en: 'Na', vi: 'Na' },
      ], answer: 2 },
      { q: 'Chiếc xe của Bo màu gì?', options: [
        { emoji: '🔴', en: 'Red', vi: 'Màu đỏ' },
        { emoji: '🟢', en: 'Green', vi: 'Màu xanh lá' },
        { emoji: '🔵', en: 'Blue', vi: 'Màu xanh dương' },
      ], answer: 0 },
    ],
  },
];
