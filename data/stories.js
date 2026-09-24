// Truyện tranh song ngữ ngắn — mỗi truyện 4-5 trang (emoji + câu tiếng Anh + nghĩa tiếng Việt),
// đọc xong làm 2 câu hỏi hiểu truyện bằng tiếng Việt. Cùng nguyên tắc với ABC_TOPICS/PHONICS_TOPICS
// (data/alphabet.js, data/phonics.js): tách khỏi TOPICS nên không đụng khoá tuần tự/huy hiệu/mảnh
// ghép tranh, chỉ đánh dấu progress.doneTopics theo id riêng.
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
      { q: 'Bạn nhỏ đi đến đâu?', options: ['Trường học', 'Sở thú', 'Công viên'], answer: 1 },
      { q: 'Con vật nào to lớn xuất hiện trong truyện?', options: ['Con mèo', 'Con sư tử', 'Con chó'], answer: 1 },
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
      { q: 'Hôm nay là ngày gì?', options: ['Sinh nhật', 'Trung thu', 'Giáng sinh'], answer: 0 },
      { q: 'Bạn nhỏ và các bạn cùng ăn gì?', options: ['Kẹo', 'Bánh', 'Trái cây'], answer: 1 },
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
      { q: 'Bạn nhỏ mang theo gì khi trời mưa?', options: ['Mũ', 'Ô (dù)', 'Kính'], answer: 1 },
      { q: 'Sau cơn mưa, bạn nhỏ nhìn thấy gì?', options: ['Mặt trời', 'Cầu vồng', 'Ngôi sao'], answer: 1 },
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
      { q: 'Chúng tôi đến thăm nơi nào?', options: ['Trang trại', 'Bãi biển', 'Sở thú'], answer: 0 },
      { q: 'Con bò kêu tiếng gì?', options: ['Cục tác', 'Moo', 'Ụt ịt'], answer: 1 },
    ],
  },
];
