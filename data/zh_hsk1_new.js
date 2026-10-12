// HSK 1 CHUẨN MỚI (2021) — 180 từ hay gặp của cấp 1 mới mà danh sách HSK 1 cũ (ZH_HSK1, data/zh_roadmap.js)
// và các chủ đề có hình (data/topics_zh.js) chưa dạy. Dùng cho Phần 5 của khoá (data/zh_course.js, nguồn
// từ { hsk: 'hn_day1', … } — zh-course.js tìm trong cả ZH_HSK1 lẫn ZH_HSK1_NEW).
// Cấp 1 chuẩn mới có khoảng 500 từ; đây là phần thông dụng nhất, CẦN GIÁO VIÊN ĐỐI CHIẾU với danh sách chính thức.
// Mỗi nhóm 10 từ = 1 bài "Từ mới". Mỗi từ: [chữ, pinyin, nghĩa, hình (tuỳ chọn, 1 emoji đơn)].
const ZH_HSK1_NEW = [
  // ----- Chặng 25 · Một ngày của tôi -----
  { id: 'hn_day1', title: 'Thời gian trong ngày', words: [
    ['早上', 'zǎoshang', 'buổi sáng (sớm)', '🌅'], ['晚上', 'wǎnshang', 'buổi tối', '🌙'], ['白天', 'báitiān', 'ban ngày', '☀️'],
    ['每天', 'měitiān', 'mỗi ngày', '📅'], ['小时', 'xiǎoshí', 'tiếng (đồng hồ)', '⏳'], ['半', 'bàn', 'rưỡi, một nửa', '🌗'],
    ['一会儿', 'yíhuìr', 'một lát'], ['时间', 'shíjiān', 'thời gian', '⏰'], ['早', 'zǎo', 'sớm'], ['晚', 'wǎn', 'muộn, tối'],
  ] },
  { id: 'hn_day2', title: 'Sinh hoạt hằng ngày', words: [
    ['起床', 'qǐchuáng', 'thức dậy', '🛏️'], ['洗', 'xǐ', 'rửa, giặt', '🧼'], ['洗手间', 'xǐshǒujiān', 'nhà vệ sinh', '🚻'],
    ['早饭', 'zǎofàn', 'bữa sáng', '🥣'], ['午饭', 'wǔfàn', 'bữa trưa', '🍱'], ['晚饭', 'wǎnfàn', 'bữa tối', '🍲'],
    ['上班', 'shàngbān', 'đi làm', '💼'], ['下班', 'xiàbān', 'tan làm'], ['休息', 'xiūxi', 'nghỉ ngơi', '😌'], ['忙', 'máng', 'bận'],
  ] },
  { id: 'hn_day3', title: 'Ngày tháng', words: [
    ['今年', 'jīnnián', 'năm nay'], ['去年', 'qùnián', 'năm ngoái'], ['明年', 'míngnián', 'sang năm'],
    ['前天', 'qiántiān', 'hôm kia'], ['后天', 'hòutiān', 'ngày kia'], ['生日', 'shēngrì', 'sinh nhật', '🎂'],
    ['新年', 'xīnnián', 'năm mới', '🎆'], ['星期天', 'xīngqītiān', 'Chủ nhật'], ['已经', 'yǐjīng', 'đã (rồi)'], ['马上', 'mǎshàng', 'ngay, lập tức'],
  ] },
  // ----- Chặng 26 · Trường lớp & học tập -----
  { id: 'hn_school1', title: 'Đi học', words: [
    ['上课', 'shàngkè', 'vào học', '🔔'], ['下课', 'xiàkè', 'tan học'], ['上学', 'shàngxué', 'đi học', '🎒'],
    ['放学', 'fàngxué', 'tan trường'], ['课', 'kè', 'bài học, tiết học'], ['课本', 'kèběn', 'sách giáo khoa', '📘'],
    ['本子', 'běnzi', 'quyển vở', '📓'], ['班', 'bān', 'lớp'], ['年级', 'niánjí', 'khối lớp (lớp mấy)'], ['小学', 'xiǎoxué', 'tiểu học', '🏫'],
  ] },
  { id: 'hn_school2', title: 'Trong giờ học', words: [
    ['中学', 'zhōngxué', 'trung học'], ['大学', 'dàxué', 'đại học', '🎓'], ['大学生', 'dàxuéshēng', 'sinh viên'],
    ['图书馆', 'túshūguǎn', 'thư viện', '📚'], ['问', 'wèn', 'hỏi'], ['问题', 'wèntí', 'câu hỏi, vấn đề', '❓'],
    ['回答', 'huídá', 'trả lời'], ['考试', 'kǎoshì', 'thi, kiểm tra', '📝'], ['难', 'nán', 'khó'], ['对', 'duì', 'đúng', '✅'],
  ] },
  { id: 'hn_school3', title: 'Hiểu bài', words: [
    ['错', 'cuò', 'sai', '❌'], ['知道', 'zhīdào', 'biết'], ['明白', 'míngbai', 'hiểu'], ['教', 'jiāo', 'dạy'],
    ['中文', 'Zhōngwén', 'tiếng Trung'], ['外语', 'wàiyǔ', 'ngoại ngữ'], ['汉字', 'Hànzì', 'chữ Hán'], ['页', 'yè', 'trang (sách)'],
    ['第一', 'dìyī', 'thứ nhất', '🥇'], ['认真', 'rènzhēn', 'chăm chỉ, nghiêm túc'],
  ] },
  // ----- Chặng 27 · Đi lại & phương hướng -----
  { id: 'hn_way1', title: 'Đường đi', words: [
    ['路', 'lù', 'đường', '🛣️'], ['马路', 'mǎlù', 'đường lớn'], ['路口', 'lùkǒu', 'ngã tư, giao lộ', '🚦'],
    ['走', 'zǒu', 'đi (bộ)', '🚶'], ['跑', 'pǎo', 'chạy', '🏃'], ['到', 'dào', 'đến'], ['从', 'cóng', 'từ'],
    ['离', 'lí', 'cách (xa / gần)'], ['远', 'yuǎn', 'xa'], ['近', 'jìn', 'gần'],
  ] },
  { id: 'hn_way2', title: 'Phương hướng', words: [
    ['左边', 'zuǒbian', 'bên trái', '⬅️'], ['右边', 'yòubian', 'bên phải', '➡️'], ['旁边', 'pángbiān', 'bên cạnh'],
    ['中间', 'zhōngjiān', 'ở giữa'], ['外边', 'wàibian', 'bên ngoài'], ['东', 'dōng', 'phía đông'], ['西', 'xī', 'phía tây'],
    ['南', 'nán', 'phía nam'], ['北', 'běi', 'phía bắc', '🧭'], ['地方', 'dìfang', 'nơi, chỗ', '📍'],
  ] },
  { id: 'hn_way3', title: 'Xe cộ & bến bãi', words: [
    ['车站', 'chēzhàn', 'bến xe', '🚏'], ['机场', 'jīchǎng', 'sân bay', '🛫'], ['车票', 'chēpiào', 'vé xe', '🎫'],
    ['机票', 'jīpiào', 'vé máy bay'], ['打车', 'dǎchē', 'gọi taxi', '🚕'], ['上车', 'shàngchē', 'lên xe'], ['下车', 'xiàchē', 'xuống xe'],
    ['地图', 'dìtú', 'bản đồ', '🗺️'], ['门口', 'ménkǒu', 'cửa ra vào'], ['找', 'zhǎo', 'tìm', '🔍'],
  ] },
  // ----- Chặng 28 · Ăn uống & mua sắm -----
  { id: 'hn_shop1', title: 'Ăn uống', words: [
    ['饭', 'fàn', 'cơm, bữa ăn', '🍚'], ['吃饭', 'chīfàn', 'ăn cơm'], ['做饭', 'zuòfàn', 'nấu cơm', '🍳'],
    ['肉', 'ròu', 'thịt', '🥩'], ['包子', 'bāozi', 'bánh bao', '🥟'], ['好吃', 'hǎochī', 'ngon', '😋'], ['饿', 'è', 'đói'],
    ['渴', 'kě', 'khát'], ['杯', 'bēi', 'cốc, ly (lượng từ)', '🥛'], ['要', 'yào', 'muốn, cần'],
  ] },
  { id: 'hn_shop2', title: 'Mua bán', words: [
    ['卖', 'mài', 'bán'], ['贵', 'guì', 'đắt', '💸'], ['元', 'yuán', 'đồng (tệ)', '💴'], ['毛', 'máo', 'hào (1/10 đồng)'],
    ['钱包', 'qiánbāo', 'ví tiền', '👛'], ['手机', 'shǒujī', 'điện thoại di động', '📱'], ['包', 'bāo', 'túi, cặp', '👜'],
    ['新', 'xīn', 'mới', '✨'], ['两', 'liǎng', 'hai (khi đếm)'], ['零', 'líng', 'số không'],
  ] },
  { id: 'hn_shop3', title: 'So sánh & lựa chọn', words: [
    ['百', 'bǎi', 'trăm', '💯'], ['一样', 'yíyàng', 'giống nhau'], ['别的', 'biéde', 'cái khác'], ['还', 'hái', 'còn, vẫn'],
    ['还是', 'háishi', 'hay là'], ['非常', 'fēicháng', 'vô cùng, rất'], ['真', 'zhēn', 'thật'], ['最', 'zuì', 'nhất', '🏆'],
    ['一半', 'yíbàn', 'một nửa'], ['再', 'zài', 'lại, nữa'],
  ] },
  // ----- Chặng 29 · Con người & sức khoẻ -----
  { id: 'hn_people1', title: 'Nhà cửa & gia đình', words: [
    ['房间', 'fángjiān', 'căn phòng', '🛏️'], ['房子', 'fángzi', 'ngôi nhà', '🏠'], ['家人', 'jiārén', 'người nhà', '👪'],
    ['弟弟', 'dìdi', 'em trai', '👦'], ['妹妹', 'mèimei', 'em gái', '👧'], ['孩子', 'háizi', 'con, trẻ em', '🧒'],
    ['小朋友', 'xiǎopéngyou', 'bạn nhỏ'], ['男', 'nán', 'nam'], ['女', 'nǚ', 'nữ'], ['老人', 'lǎorén', 'người già', '👴'],
  ] },
  { id: 'hn_people2', title: 'Mọi người', words: [
    ['男孩儿', 'nánháir', 'bé trai'], ['女孩儿', 'nǚháir', 'bé gái'], ['大家', 'dàjiā', 'mọi người'], ['别人', 'biérén', 'người khác'],
    ['您', 'nín', 'ông / bà / ngài (lịch sự)'], ['他们', 'tāmen', 'họ, các anh ấy'], ['你们', 'nǐmen', 'các bạn'],
    ['身体', 'shēntǐ', 'cơ thể, sức khoẻ', '💪'], ['病', 'bìng', 'bệnh'], ['病人', 'bìngrén', 'người bệnh'],
  ] },
  { id: 'hn_people3', title: 'Sức khoẻ & cảnh vật', words: [
    ['生病', 'shēngbìng', 'bị ốm', '🤒'], ['看病', 'kànbìng', 'khám bệnh', '🩺'], ['累', 'lèi', 'mệt', '😫'],
    ['笑', 'xiào', 'cười', '😄'], ['生气', 'shēngqì', 'tức giận', '😠'], ['树', 'shù', 'cây', '🌳'], ['花', 'huā', 'hoa', '🌸'],
    ['山', 'shān', 'núi', '⛰️'], ['楼', 'lóu', 'toà nhà, tầng', '🏢'], ['电话', 'diànhuà', 'điện thoại', '☎️'],
  ] },
  // ----- Chặng 30 · Sở thích & hành động -----
  { id: 'hn_act1', title: 'Sở thích', words: [
    ['爱好', 'àihào', 'sở thích'], ['唱歌', 'chànggē', 'hát', '🎤'], ['歌', 'gē', 'bài hát', '🎵'], ['打球', 'dǎqiú', 'chơi bóng', '⚽'],
    ['玩儿', 'wánr', 'chơi'], ['好玩儿', 'hǎowánr', 'vui, thú vị'], ['好看', 'hǎokàn', 'đẹp, hay (để xem)'],
    ['好听', 'hǎotīng', 'hay (để nghe)'], ['上网', 'shàngwǎng', 'lên mạng', '💻'], ['放假', 'fàngjià', 'được nghỉ (lễ)', '🏖️'],
  ] },
  { id: 'hn_act2', title: 'Giúp đỡ & trao đổi', words: [
    ['觉得', 'juéde', 'cảm thấy'], ['告诉', 'gàosu', 'nói cho biết'], ['介绍', 'jièshào', 'giới thiệu'], ['帮', 'bāng', 'giúp', '🤝'],
    ['给', 'gěi', 'cho, đưa', '🎁'], ['送', 'sòng', 'tặng, tiễn'], ['拿', 'ná', 'cầm, lấy'], ['放', 'fàng', 'đặt, để'],
    ['用', 'yòng', 'dùng'], ['等', 'děng', 'đợi'],
  ] },
  { id: 'hn_act3', title: 'Động tác thường ngày', words: [
    ['进', 'jìn', 'vào', '🚪'], ['出', 'chū', 'ra'], ['开车', 'kāichē', 'lái xe', '🚗'], ['关', 'guān', 'đóng, tắt'],
    ['打开', 'dǎkāi', 'mở ra'], ['忘', 'wàng', 'quên'], ['记住', 'jìzhù', 'nhớ kỹ'], ['试', 'shì', 'thử'],
    ['让', 'ràng', 'bảo, để cho'], ['跟', 'gēn', 'với, cùng'],
  ] },
];
