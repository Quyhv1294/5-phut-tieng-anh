  // LUYỆN NGHE CÂU & HỘI THOẠI cho Phần 3 · HSK 1 (zh-course.js — bài quiz có `listen: 'u7'`, và ô
  // "Luyện nghe câu" ở tab Luyện tập). Chỉ dùng từ HSK 1; KHÔNG trùng câu với đề thi thử (data/zh_hsk1_exam.js)
  // để điểm thi thử còn khách quan. Giọng máy đọc nên câu hỏi hội thoại hỏi về NỘI DUNG (không hỏi "người
  // nam / người nữ" như đề thật vì máy chỉ có 1 giọng).
  //   sentences  { s, py, vi }                      → nghe câu, chọn nghĩa tiếng Việt đúng
  //   dialogues  { lines: [[chữ, pinyin], …], vi, q, qpy, opts: [[chữ, pinyin], …], a }
  //              → nghe hội thoại, trả lời câu hỏi (a = vị trí đáp án đúng trong opts)
  const ZH_LISTEN = {
    u7: { // Tôi và bạn
      sentences: [
        { s: '我叫王小明。', py: 'Wǒ jiào Wáng Xiǎomíng.', vi: 'Tôi tên là Vương Tiểu Minh.' },
        { s: '她是我的朋友。', py: 'Tā shì wǒ de péngyou.', vi: 'Cô ấy là bạn của tôi.' },
        { s: '他是中国人吗？', py: 'Tā shì Zhōngguó rén ma?', vi: 'Anh ấy là người Trung Quốc phải không?' },
        { s: '我们都是学生。', py: 'Wǒmen dōu shì xuésheng.', vi: 'Chúng tôi đều là học sinh.' },
        { s: '认识你很高兴。', py: 'Rènshi nǐ hěn gāoxìng.', vi: 'Rất vui được quen bạn.' },
        { s: '那个人是谁？', py: 'Nàge rén shì shéi?', vi: 'Người kia là ai?' },
      ],
      dialogues: [
        { lines: [['这是谁？', 'Zhè shì shéi?'], ['这是我的同学，她叫李月。', 'Zhè shì wǒ de tóngxué, tā jiào Lǐ Yuè.']], vi: 'Đây là ai? — Đây là bạn học của tôi, cô ấy tên Lý Nguyệt.',
          q: '李月是谁？', qpy: 'Lǐ Yuè shì shéi?', opts: [['同学', 'tóngxué'], ['老师', 'lǎoshī'], ['医生', 'yīshēng']], a: 0 },
        { lines: [['你认识那个人吗？', 'Nǐ rènshi nàge rén ma?'], ['认识，他是我们的汉语老师。', 'Rènshi, tā shì wǒmen de Hànyǔ lǎoshī.']], vi: 'Bạn có quen người kia không? — Quen, đó là thầy dạy tiếng Hán của chúng tôi.',
          q: '那个人是做什么的？', qpy: 'Nàge rén shì zuò shénme de?', opts: [['老师', 'lǎoshī'], ['学生', 'xuésheng'], ['医生', 'yīshēng']], a: 0 },
        { lines: [['你多大了？', 'Nǐ duō dà le?'], ['我今年二十岁。', 'Wǒ jīnnián èrshí suì.']], vi: 'Bạn bao nhiêu tuổi rồi? — Năm nay tôi 20 tuổi.',
          q: '他今年多少岁？', qpy: 'Tā jīnnián duōshao suì?', opts: [['十岁', 'shí suì'], ['二十岁', 'èrshí suì'], ['十二岁', 'shí’èr suì']], a: 1 },
      ],
    },
    u8: { // Gia đình & nghề nghiệp
      sentences: [
        { s: '我爸爸是医生。', py: 'Wǒ bàba shì yīshēng.', vi: 'Bố tôi là bác sĩ.' },
        { s: '她有一个女儿。', py: 'Tā yǒu yí gè nǚ’ér.', vi: 'Cô ấy có một cô con gái.' },
        { s: '我儿子在学校学习。', py: 'Wǒ érzi zài xuéxiào xuéxí.', vi: 'Con trai tôi học ở trường.' },
        { s: '我妈妈是老师。', py: 'Wǒ māma shì lǎoshī.', vi: 'Mẹ tôi là giáo viên.' },
        { s: '我家有猫，没有狗。', py: 'Wǒ jiā yǒu māo, méiyǒu gǒu.', vi: 'Nhà tôi có mèo, không có chó.' },
        { s: '他在北京工作。', py: 'Tā zài Běijīng gōngzuò.', vi: 'Anh ấy làm việc ở Bắc Kinh.' },
      ],
      dialogues: [
        { lines: [['你女儿做什么工作？', 'Nǐ nǚ’ér zuò shénme gōngzuò?'], ['她是医生，在医院工作。', 'Tā shì yīshēng, zài yīyuàn gōngzuò.']], vi: 'Con gái bạn làm nghề gì? — Cháu là bác sĩ, làm ở bệnh viện.',
          q: '他女儿在哪儿工作？', qpy: 'Tā nǚ’ér zài nǎr gōngzuò?', opts: [['医院', 'yīyuàn'], ['学校', 'xuéxiào'], ['商店', 'shāngdiàn']], a: 0 },
        { lines: [['你有儿子吗？', 'Nǐ yǒu érzi ma?'], ['没有，我有一个女儿。', 'Méiyǒu, wǒ yǒu yí gè nǚ’ér.']], vi: 'Bạn có con trai không? — Không, tôi có một cô con gái.',
          q: '他有什么？', qpy: 'Tā yǒu shénme?', opts: [['一个女儿', 'yí gè nǚ’ér'], ['一个儿子', 'yí gè érzi'], ['一个朋友', 'yí gè péngyou']], a: 0 },
        { lines: [['这是你的狗吗？', 'Zhè shì nǐ de gǒu ma?'], ['不是，是我朋友的。', 'Bú shì, shì wǒ péngyou de.']], vi: 'Đây là chó của bạn à? — Không, của bạn tôi.',
          q: '这是谁的狗？', qpy: 'Zhè shì shéi de gǒu?', opts: [['他朋友的', 'tā péngyou de'], ['他的', 'tā de'], ['他老师的', 'tā lǎoshī de']], a: 0 },
      ],
    },
    u9: { // Giờ giấc & số lượng
      sentences: [
        { s: '现在十点二十分。', py: 'Xiànzài shí diǎn èrshí fēn.', vi: 'Bây giờ là 10 giờ 20 phút.' },
        { s: '我明天上午九点去学校。', py: 'Wǒ míngtiān shàngwǔ jiǔ diǎn qù xuéxiào.', vi: '9 giờ sáng mai tôi đến trường.' },
        { s: '今天是三月八号。', py: 'Jīntiān shì sān yuè bā hào.', vi: 'Hôm nay là ngày 8 tháng 3.' },
        { s: '我们星期六去看电影。', py: 'Wǒmen xīngqīliù qù kàn diànyǐng.', vi: 'Thứ Bảy chúng tôi đi xem phim.' },
        { s: '我中午十二点吃饭。', py: 'Wǒ zhōngwǔ shí’èr diǎn chī fàn.', vi: 'Tôi ăn cơm lúc 12 giờ trưa.' },
        { s: '他昨天几点回家？', py: 'Tā zuótiān jǐ diǎn huí jiā?', vi: 'Hôm qua mấy giờ anh ấy về nhà?' },
      ],
      dialogues: [
        { lines: [['你几点去商店？', 'Nǐ jǐ diǎn qù shāngdiàn?'], ['下午三点。', 'Xiàwǔ sān diǎn.']], vi: 'Mấy giờ bạn đi cửa hàng? — 3 giờ chiều.',
          q: '他几点去商店？', qpy: 'Tā jǐ diǎn qù shāngdiàn?', opts: [['上午三点', 'shàngwǔ sān diǎn'], ['下午三点', 'xiàwǔ sān diǎn'], ['下午四点', 'xiàwǔ sì diǎn']], a: 1 },
        { lines: [['今天几号？', 'Jīntiān jǐ hào?'], ['今天十五号，星期三。', 'Jīntiān shíwǔ hào, xīngqīsān.']], vi: 'Hôm nay ngày bao nhiêu? — Hôm nay ngày 15, thứ Tư.',
          q: '今天星期几？', qpy: 'Jīntiān xīngqī jǐ?', opts: [['星期一', 'xīngqīyī'], ['星期三', 'xīngqīsān'], ['星期五', 'xīngqīwǔ']], a: 1 },
        { lines: [['你什么时候去北京？', 'Nǐ shénme shíhou qù Běijīng?'], ['我下个月去。', 'Wǒ xià gè yuè qù.']], vi: 'Khi nào bạn đi Bắc Kinh? — Tháng sau tôi đi.',
          q: '他什么时候去北京？', qpy: 'Tā shénme shíhou qù Běijīng?', opts: [['下个月', 'xià gè yuè'], ['明天', 'míngtiān'], ['今天下午', 'jīntiān xiàwǔ']], a: 0 },
      ],
    },
    u10: { // Mua sắm & đồ vật
      sentences: [
        { s: '这本书多少钱？', py: 'Zhè běn shū duōshao qián?', vi: 'Quyển sách này bao nhiêu tiền?' },
        { s: '我想买一个杯子。', py: 'Wǒ xiǎng mǎi yí gè bēizi.', vi: 'Tôi muốn mua một cái cốc.' },
        { s: '这些水果很好吃。', py: 'Zhèxiē shuǐguǒ hěn hǎochī.', vi: 'Chỗ hoa quả này rất ngon.' },
        { s: '桌子上有一个电脑。', py: 'Zhuōzi shang yǒu yí gè diànnǎo.', vi: 'Trên bàn có một cái máy tính.' },
        { s: '椅子在桌子后面。', py: 'Yǐzi zài zhuōzi hòumiàn.', vi: 'Cái ghế ở phía sau cái bàn.' },
        { s: '苹果三块钱一个。', py: 'Píngguǒ sān kuài qián yí gè.', vi: 'Táo ba đồng một quả.' },
      ],
      dialogues: [
        { lines: [['你买了什么？', 'Nǐ mǎi le shénme?'], ['我买了一些苹果和茶。', 'Wǒ mǎi le yìxiē píngguǒ hé chá.']], vi: 'Bạn đã mua gì? — Tôi mua ít táo và trà.',
          q: '他买了什么？', qpy: 'Tā mǎi le shénme?', opts: [['苹果和茶', 'píngguǒ hé chá'], ['衣服和书', 'yīfu hé shū'], ['杯子和水', 'bēizi hé shuǐ']], a: 0 },
        { lines: [['你的书在哪儿？', 'Nǐ de shū zài nǎr?'], ['在桌子上面。', 'Zài zhuōzi shàngmiàn.']], vi: 'Sách của bạn ở đâu? — Ở trên bàn.',
          q: '书在哪儿？', qpy: 'Shū zài nǎr?', opts: [['桌子上面', 'zhuōzi shàngmiàn'], ['椅子下面', 'yǐzi xiàmiàn'], ['电脑后面', 'diànnǎo hòumiàn']], a: 0 },
        { lines: [['这个电脑是你的吗？', 'Zhège diànnǎo shì nǐ de ma?'], ['不是，是我爸爸的。', 'Bú shì, shì wǒ bàba de.']], vi: 'Máy tính này là của bạn à? — Không, của bố tôi.',
          q: '电脑是谁的？', qpy: 'Diànnǎo shì shéi de?', opts: [['他爸爸的', 'tā bàba de'], ['他的', 'tā de'], ['他朋友的', 'tā péngyou de']], a: 0 },
      ],
    },
    u11: { // Hoạt động hằng ngày
      sentences: [
        { s: '我想去中国学习汉语。', py: 'Wǒ xiǎng qù Zhōngguó xuéxí Hànyǔ.', vi: 'Tôi muốn sang Trung Quốc học tiếng Hán.' },
        { s: '你会做中国菜吗？', py: 'Nǐ huì zuò Zhōngguó cài ma?', vi: 'Bạn có biết nấu món Trung Quốc không?' },
        { s: '我能坐这儿吗？', py: 'Wǒ néng zuò zhèr ma?', vi: 'Tôi có thể ngồi đây không?' },
        { s: '他在睡觉呢。', py: 'Tā zài shuìjiào ne.', vi: 'Anh ấy đang ngủ.' },
        { s: '下午我和朋友去看电影。', py: 'Xiàwǔ wǒ hé péngyou qù kàn diànyǐng.', vi: 'Chiều nay tôi với bạn đi xem phim.' },
        { s: '妈妈在做饭，爸爸在看电视。', py: 'Māma zài zuò fàn, bàba zài kàn diànshì.', vi: 'Mẹ đang nấu cơm, bố đang xem ti vi.' },
      ],
      dialogues: [
        { lines: [['你会说汉语吗？', 'Nǐ huì shuō Hànyǔ ma?'], ['会一点儿。', 'Huì yìdiǎnr.']], vi: 'Bạn biết nói tiếng Hán không? — Biết một chút.',
          q: '他会说汉语吗？', qpy: 'Tā huì shuō Hànyǔ ma?', opts: [['会一点儿', 'huì yìdiǎnr'], ['不会', 'bú huì'], ['不想说', 'bù xiǎng shuō']], a: 0 },
        { lines: [['明天你想做什么？', 'Míngtiān nǐ xiǎng zuò shénme?'], ['我想在家睡觉。', 'Wǒ xiǎng zài jiā shuìjiào.']], vi: 'Ngày mai bạn muốn làm gì? — Tôi muốn ở nhà ngủ.',
          q: '他明天想做什么？', qpy: 'Tā míngtiān xiǎng zuò shénme?', opts: [['在家睡觉', 'zài jiā shuìjiào'], ['去学校', 'qù xuéxiào'], ['去看电影', 'qù kàn diànyǐng']], a: 0 },
        { lines: [['你在做什么呢？', 'Nǐ zài zuò shénme ne?'], ['我在写字呢。', 'Wǒ zài xiě zì ne.']], vi: 'Bạn đang làm gì thế? — Tôi đang viết chữ.',
          q: '他在做什么？', qpy: 'Tā zài zuò shénme?', opts: [['写字', 'xiě zì'], ['看书', 'kàn shū'], ['打电话', 'dǎ diànhuà']], a: 0 },
      ],
    },
    u12: { // Giao tiếp tự nhiên
      sentences: [
        { s: '这个饭店怎么样？', py: 'Zhège fàndiàn zěnmeyàng?', vi: 'Nhà hàng này thế nào?' },
        { s: '我很好，你呢？', py: 'Wǒ hěn hǎo, nǐ ne?', vi: 'Tôi khoẻ, còn bạn?' },
        { s: '我们都喜欢喝茶。', py: 'Wǒmen dōu xǐhuan hē chá.', vi: 'Chúng tôi đều thích uống trà.' },
        { s: '我和妈妈去商店。', py: 'Wǒ hé māma qù shāngdiàn.', vi: 'Tôi với mẹ đi cửa hàng.' },
        { s: '你怎么去学校？', py: 'Nǐ zěnme qù xuéxiào?', vi: 'Bạn đến trường bằng cách nào?' },
        { s: '这个苹果太大了！', py: 'Zhège píngguǒ tài dà le!', vi: 'Quả táo này to quá!' },
      ],
      dialogues: [
        { lines: [['你女儿的汉语怎么样？', 'Nǐ nǚ’ér de Hànyǔ zěnmeyàng?'], ['很好，她会写很多字。', 'Hěn hǎo, tā huì xiě hěn duō zì.']], vi: 'Tiếng Hán của con gái bạn thế nào? — Rất tốt, cháu viết được nhiều chữ.',
          q: '他女儿的汉语怎么样？', qpy: 'Tā nǚ’ér de Hànyǔ zěnmeyàng?', opts: [['很好', 'hěn hǎo'], ['不太好', 'bú tài hǎo'], ['不会说', 'bú huì shuō']], a: 0 },
        { lines: [['你们怎么去饭店？', 'Nǐmen zěnme qù fàndiàn?'], ['我们坐出租车去。', 'Wǒmen zuò chūzūchē qù.']], vi: 'Các bạn đến nhà hàng bằng gì? — Chúng tôi đi taxi.',
          q: '他们怎么去饭店？', qpy: 'Tāmen zěnme qù fàndiàn?', opts: [['坐出租车', 'zuò chūzūchē'], ['坐飞机', 'zuò fēijī'], ['不去', 'bú qù']], a: 0 },
        { lines: [['我们都去，你呢？', 'Wǒmen dōu qù, nǐ ne?'], ['我不去，我想在家看电视。', 'Wǒ bú qù, wǒ xiǎng zài jiā kàn diànshì.']], vi: 'Chúng tôi đều đi, còn bạn? — Tôi không đi, tôi muốn ở nhà xem ti vi.',
          q: '他想在家做什么？', qpy: 'Tā xiǎng zài jiā zuò shénme?', opts: [['看电视', 'kàn diànshì'], ['睡觉', 'shuìjiào'], ['做饭', 'zuò fàn']], a: 0 },
      ],
    },
  };
