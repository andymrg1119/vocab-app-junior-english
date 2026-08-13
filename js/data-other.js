/**
 * data-other.js
 * 其他版本（人教版PEP、外研版）的示例数据
 * 结构与译林版一致
 */

/* ========== 人教版 (PEP) 七年级上册 ========== */
window.VocabData['pep'] = window.VocabData['pep'] || {};
window.VocabData['pep']['7a'] = [
  {
    unitId: 'pep-7a-u1',
    title: 'Unit 1: My name\'s Gina.',
    topic: '自我介绍',
    words: [
      { word: 'name', phonetic: '/neɪm/', pos: 'n.', meaning: '名字', example: 'My name is Gina.', exampleCn: '我的名字叫吉娜。' },
      { word: 'nice', phonetic: '/naɪs/', pos: 'adj.', meaning: '令人愉快的', example: 'Nice to meet you.', exampleCn: '很高兴见到你。' },
      { word: 'meet', phonetic: '/miːt/', pos: 'v.', meaning: '遇见', example: 'Nice to meet you.', exampleCn: '很高兴见到你。' },
      { word: 'too', phonetic: '/tuː/', pos: 'adv.', meaning: '也', example: 'I am a student, too.', exampleCn: '我也是一名学生。' },
      { word: 'your', phonetic: '/jɔː(r)/', pos: 'pron.', meaning: '你的', example: 'What is your name?', exampleCn: '你叫什么名字？' },
      { word: 'his', phonetic: '/hɪz/', pos: 'pron.', meaning: '他的', example: 'His name is Tony.', exampleCn: '他的名字叫托尼。' },
      { word: 'her', phonetic: '/hɜː(r)/', pos: 'pron.', meaning: '她的', example: 'Her name is Jenny.', exampleCn: '她的名字叫珍妮。' },
      { word: 'first', phonetic: '/fɜːst/', pos: 'adj.', meaning: '第一的', example: 'My first name is Tom.', exampleCn: '我的名字叫汤姆。' },
      { word: 'last', phonetic: '/lɑːst/', pos: 'adj.', meaning: '最后的', example: 'His last name is Smith.', exampleCn: '他姓史密斯。' },
      { word: 'friend', phonetic: '/frend/', pos: 'n.', meaning: '朋友', example: 'She is my friend.', exampleCn: '她是我的朋友。' },
      { word: 'telephone', phonetic: '/ˈtelɪfəʊn/', pos: 'n.', meaning: '电话', example: 'What is your telephone number?', exampleCn: '你的电话号码是多少？' },
      { word: 'number', phonetic: '/ˈnʌmbə(r)/', pos: 'n.', meaning: '号码', example: 'My phone number is 123.', exampleCn: '我的电话号码是123。' },
      { word: 'card', phonetic: '/kɑːd/', pos: 'n.', meaning: '卡片', example: 'This is my ID card.', exampleCn: '这是我的身份证。' },
      { word: 'family', phonetic: '/ˈfæməli/', pos: 'n.', meaning: '家庭', example: 'This is my family.', exampleCn: '这是我的家庭。' }
    ],
    phrases: [
      { phrase: 'nice to meet you', meaning: '很高兴见到你', example: 'Hi, nice to meet you!' },
      { phrase: 'first name', meaning: '名字', example: 'My first name is David.' },
      { phrase: 'last name', meaning: '姓', example: 'Her last name is Brown.' },
      { phrase: 'telephone number', meaning: '电话号码', example: 'What is your telephone number?' },
      { phrase: 'ID card', meaning: '身份证', example: 'Show me your ID card.' }
    ],
    sentences: [
      { en: 'What\'s your name?', cn: '你叫什么名字？' },
      { en: 'My name\'s Gina.', cn: '我的名字叫吉娜。' },
      { en: 'Nice to meet you!', cn: '很高兴见到你！' },
      { en: 'His telephone number is 555-1234.', cn: '他的电话号码是555-1234。' },
      { en: 'Her family name is Wang.', cn: '她姓王。' }
    ],
    text: {
      title: 'My Name\'s Gina',
      paragraphs: [
        {
          sentences: [
            { en: 'Hello! My name is Jenny.', cn: '你好！我的名字叫珍妮。', keywords: ['Hello', 'name'] },
            { en: 'I am a student at No. 1 Middle School.', cn: '我是第一中学的一名学生。', keywords: ['student', 'No. 1 Middle School'] },
            { en: 'My telephone number is 281-9176.', cn: '我的电话号码是281-9176。', keywords: ['telephone number'] },
            { en: 'My friend is Gina.', cn: '我的朋友是吉娜。', keywords: ['friend'] }
          ]
        }
      ]
    },
    grammar: {
      title: '物主代词的用法',
      points: [
        {
          rule: '物主代词表示"某人的"',
          detail: 'my(我的)、your(你的/你们的)、his(他的)、her(她的)用于形容词性物主代词，放在名词前',
          examples: ['My name is Tom.', 'Her telephone number is 123.', 'His friend is nice.']
        }
      ]
    },
    exams: [
      {
        question: '—What\'s ___ name? —___ name is Jenny.',
        options: ['A. your; My', 'B. you; My', 'C. your; I', 'D. you; I'],
        answer: 'A',
        explanation: '修饰名词name要用形容词性物主代词your和my。'
      },
      {
        question: 'His name ___ Tony.',
        options: ['A. am', 'B. is', 'C. are', 'D. be'],
        answer: 'B',
        explanation: '主语His name是第三人称单数，be动词用is。'
      },
      {
        question: '—Nice to meet you! —___',
        options: ['A. Thank you.', 'B. Nice to meet you, too!', 'C. You\'re welcome.', 'D. OK.'],
        answer: 'B',
        explanation: '对方说"很高兴见到你"，回答也应说"我也很高兴见到你"。'
      }
    ]
  },
  {
    unitId: 'pep-7a-u2',
    title: 'Unit 2: This is my sister.',
    topic: '家庭成员',
    words: [
      { word: 'sister', phonetic: '/ˈsɪstə(r)/', pos: 'n.', meaning: '姐姐；妹妹', example: 'This is my sister.', exampleCn: '这是我妹妹。' },
      { word: 'mother', phonetic: '/ˈmʌðə(r)/', pos: 'n.', meaning: '母亲', example: 'My mother is a teacher.', exampleCn: '我妈妈是一名老师。' },
      { word: 'father', phonetic: '/ˈfɑːðə(r)/', pos: 'n.', meaning: '父亲', example: 'My father is a doctor.', exampleCn: '我爸爸是一名医生。' },
      { word: 'parent', phonetic: '/ˈpeərənt/', pos: 'n.', meaning: '父母', example: 'My parents love me.', exampleCn: '我的父母爱我。' },
      { word: 'brother', phonetic: '/ˈbrʌðə(r)/', pos: 'n.', meaning: '哥哥；弟弟', example: 'He is my brother.', exampleCn: '他是我弟弟。' },
      { word: 'grandfather', phonetic: '/ˈɡrænfɑːðə(r)/', pos: 'n.', meaning: '祖父', example: 'My grandfather is old.', exampleCn: '我爷爷年纪大了。' },
      { word: 'grandmother', phonetic: '/ˈɡrænmʌðə(r)/', pos: 'n.', meaning: '祖母', example: 'My grandmother is kind.', exampleCn: '我奶奶很和蔼。' },
      { word: 'aunt', phonetic: '/ɑːnt/', pos: 'n.', meaning: '阿姨；姑姑', example: 'My aunt lives in Beijing.', exampleCn: '我阿姨住在北京。' },
      { word: 'uncle', phonetic: '/ˈʌŋkl/', pos: 'n.', meaning: '叔叔；舅舅', example: 'My uncle is tall.', exampleCn: '我叔叔很高。' },
      { word: 'cousin', phonetic: '/ˈkʌzn/', pos: 'n.', meaning: '表兄弟姐妹', example: 'My cousin is ten years old.', exampleCn: '我的表弟十岁了。' },
      { word: 'son', phonetic: '/sʌn/', pos: 'n.', meaning: '儿子', example: 'He is their son.', exampleCn: '他是他们的儿子。' },
      { word: 'daughter', phonetic: '/ˈdɔːtə(r)/', pos: 'n.', meaning: '女儿', example: 'She is their daughter.', exampleCn: '她是他们的女儿。' }
    ],
    phrases: [
      { phrase: 'this is', meaning: '这是（介绍他人用）', example: 'This is my sister, Mary.' },
      { phrase: 'these are', meaning: '这些是', example: 'These are my parents.' },
      { phrase: 'have a good day', meaning: '祝你有美好的一天', example: 'Have a good day! You too.' },
      { phrase: 'family tree', meaning: '家谱', example: 'This is my family tree.' }
    ],
    sentences: [
      { en: 'This is my sister.', cn: '这是我妹妹。' },
      { en: 'These are my parents.', cn: '这是我的父母。' },
      { en: 'Who is she?', cn: '她是谁？' },
      { en: 'She is my aunt.', cn: '她是我姑姑。' },
      { en: 'Have a good day!', cn: '祝你度过美好的一天！' }
    ],
    text: {
      title: 'My Family',
      paragraphs: [
        {
          sentences: [
            { en: 'This is a photo of my family.', cn: '这是一张我家的照片。', keywords: ['photo', 'family'] },
            { en: 'These are my parents.', cn: '这是我的父母。', keywords: ['parents'] },
            { en: 'This is my grandfather and this is my grandmother.', cn: '这是我爷爷，这是我奶奶。', keywords: ['grandfather', 'grandmother'] },
            { en: 'Who is the boy? He is my brother.', cn: '那个男孩是谁？他是我弟弟。', keywords: ['boy', 'brother'] }
          ]
        }
      ]
    },
    grammar: {
      title: '指示代词 this/that/these/those',
      points: [
        {
          rule: 'this和these指近处，that和those指远处',
          detail: 'this（这个）和that（那个）用于单数；these（这些）和those（那些）用于复数。介绍他人时用This is...',
          examples: ['This is my sister.', 'These are my books.', 'That is my uncle.', 'Those are his pens.']
        }
      ]
    },
    exams: [
      {
        question: '—Who is ___? —___ is my brother.',
        options: ['A. he; He', 'B. he; His', 'C. his; He', 'D. his; His'],
        answer: 'A',
        explanation: '第一个空作主语用人称代词he，第二个空也作主语用he，首字母大写。'
      },
      {
        question: 'These ___ my parents.',
        options: ['A. is', 'B. am', 'C. are', 'D. be'],
        answer: 'C',
        explanation: '主语These是复数，be动词用are。'
      },
      {
        question: 'My father\'s sister is my ___.',
        options: ['A. aunt', 'B. uncle', 'C. cousin', 'D. sister'],
        answer: 'A',
        explanation: '父亲的姐妹是aunt（姑姑/阿姨）。'
      }
    ]
  },
  {
    unitId: 'pep-7a-u3',
    title: 'Unit 3: Is this your pencil?',
    topic: '物品归属',
    words: [
      { word: 'pencil', phonetic: '/ˈpensl/', pos: 'n.', meaning: '铅笔', example: 'Is this your pencil?', exampleCn: '这是你的铅笔吗？' },
      { word: 'book', phonetic: '/bʊk/', pos: 'n.', meaning: '书', example: 'This is my book.', exampleCn: '这是我的书。' },
      { word: 'eraser', phonetic: '/ɪˈreɪzə(r)/', pos: 'n.', meaning: '橡皮', example: 'Is that your eraser?', exampleCn: '那是你的橡皮吗？' },
      { word: 'ruler', phonetic: '/ˈruːlə(r)/', pos: 'n.', meaning: '尺子', example: 'The ruler is red.', exampleCn: '这把尺子是红色的。' },
      { word: 'pen', phonetic: '/pen/', pos: 'n.', meaning: '钢笔', example: 'My pen is blue.', exampleCn: '我的钢笔是蓝色的。' },
      { word: 'pencil box', phonetic: '/ˈpensl bɒks/', pos: 'n.', meaning: '文具盒', example: 'My pencil box is new.', exampleCn: '我的文具盒是新的。' },
      { word: 'schoolbag', phonetic: '/ˈskuːlbæɡ/', pos: 'n.', meaning: '书包', example: 'My schoolbag is heavy.', exampleCn: '我的书包很重。' },
      { word: 'dictionary', phonetic: '/ˈdɪkʃənri/', pos: 'n.', meaning: '字典', example: 'This is an English dictionary.', exampleCn: '这是一本英语字典。' },
      { word: 'mine', phonetic: '/maɪn/', pos: 'pron.', meaning: '我的', example: 'The pen is mine.', exampleCn: '这支钢笔是我的。' },
      { word: 'yours', phonetic: '/jɔːz/', pos: 'pron.', meaning: '你的', example: 'Is this book yours?', exampleCn: '这本书是你的吗？' },
      { word: 'hers', phonetic: '/hɜːz/', pos: 'pron.', meaning: '她的', example: 'The eraser is hers.', exampleCn: '这块橡皮是她的。' },
      { word: 'his', phonetic: '/hɪz/', pos: 'pron.', meaning: '他的', example: 'The ruler is his.', exampleCn: '这把尺子是他的。' },
      { word: 'excuse', phonetic: '/ɪkˈskjuːz/', pos: 'v.', meaning: '原谅', example: 'Excuse me, is this your pen?', exampleCn: '打扰一下，这是你的钢笔吗？' },
      { word: 'thank', phonetic: '/θæŋk/', pos: 'v.', meaning: '感谢', example: 'Thank you for your help.', exampleCn: '感谢你的帮助。' }
    ],
    phrases: [
      { phrase: 'excuse me', meaning: '打扰一下', example: 'Excuse me, is this your book?' },
      { phrase: 'thank you for', meaning: '为...而感谢', example: 'Thank you for your help.' },
      { phrase: 'what about', meaning: '...怎么样', example: 'What about this one?' },
      { phrase: 'you\'re welcome', meaning: '不客气', example: 'You\'re welcome!' }
    ],
    sentences: [
      { en: 'Is this your pencil?', cn: '这是你的铅笔吗？' },
      { en: 'Yes, it is. It\'s mine.', cn: '是的，是我的。' },
      { en: 'Excuse me, is that your eraser?', cn: '打扰一下，那是你的橡皮吗？' },
      { en: 'Thank you for your help.', cn: '感谢你的帮助。' },
      { en: 'You\'re welcome.', cn: '不客气。' }
    ],
    text: {
      title: 'Is This Your Pencil?',
      paragraphs: [
        {
          sentences: [
            { en: 'Excuse me, is this your pencil?', cn: '打扰一下，这是你的铅笔吗？', keywords: ['Excuse me', 'pencil'] },
            { en: 'Yes, thank you. And that is my eraser.', cn: '是的，谢谢你。那是我的橡皮。', keywords: ['eraser'] },
            { en: 'Jane, is this your ruler?', cn: '简，这是你的尺子吗？', keywords: ['ruler'] },
            { en: 'No, it isn\'t. It\'s hers.', cn: '不是，是她的。', keywords: ['hers'] }
          ]
        }
      ]
    },
    grammar: {
      title: '名词性物主代词',
      points: [
        {
          rule: '名词性物主代词可独立使用，相当于"形容词性物主代词+名词"',
          detail: 'mine=my+名词, yours=your+名词, his=his+名词, hers=her+名词。放在句末独立使用。',
          examples: ['This book is mine. (= This is my book.)', 'Is that pen yours?', 'The eraser is hers.', 'The ruler is his.']
        }
      ]
    },
    exams: [
      {
        question: '—Is this your dictionary? —Yes, it\'s ___.',
        options: ['A. my', 'B. mine', 'C. me', 'D. I'],
        answer: 'B',
        explanation: '后面没有名词，要用名词性物主代词mine。'
      },
      {
        question: '—Thank you for your help. —___',
        options: ['A. You\'re welcome.', 'B. OK.', 'C. That\'s right.', 'D. Me too.'],
        answer: 'A',
        explanation: '对方表示感谢，应回答You\'re welcome（不客气）。'
      },
      {
        question: 'The pencil is ___. (她的)',
        options: ['A. her', 'B. hers', 'C. she', 'D. him'],
        answer: 'B',
        explanation: '后面没有名词，要用名词性物主代词hers。'
      }
    ]
  }
];

/* ========== 外研版 七年级上册 ========== */
window.VocabData['waiyan'] = window.VocabData['waiyan'] || {};
window.VocabData['waiyan']['7a'] = [
  {
    unitId: 'waiyan-7a-m1',
    title: 'Module 1: My classmates',
    topic: '同学',
    words: [
      { word: 'classmate', phonetic: '/ˈklɑːsmeɪt/', pos: 'n.', meaning: '同班同学', example: 'She is my classmate.', exampleCn: '她是我的同班同学。' },
      { word: 'Chinese', phonetic: '/ˌtʃaɪˈniːz/', pos: 'adj.', meaning: '中国人的', example: 'I am Chinese.', exampleCn: '我是中国人。' },
      { word: 'English', phonetic: '/ˈɪŋɡlɪʃ/', pos: 'adj.', meaning: '英国的；英语的', example: 'He is from England. He is English.', exampleCn: '他来自英国。他是英国人。' },
      { word: 'America', phonetic: '/əˈmerɪkə/', pos: 'n.', meaning: '美国', example: 'She is from America.', exampleCn: '她来自美国。' },
      { word: 'capital', phonetic: '/ˈkæpɪtl/', pos: 'n.', meaning: '首都', example: 'Beijing is the capital of China.', exampleCn: '北京是中国的首都。' },
      { word: 'city', phonetic: '/ˈsɪti/', pos: 'n.', meaning: '城市', example: 'Shanghai is a big city.', exampleCn: '上海是个大城市。' },
      { word: 'where', phonetic: '/weə(r)/', pos: 'adv.', meaning: '在哪里', example: 'Where are you from?', exampleCn: '你来自哪里？' },
      { word: 'everyone', phonetic: '/ˈevriwʌn/', pos: 'pron.', meaning: '每个人', example: 'Everyone is here.', exampleCn: '每个人都到了。' },
      { word: 'year', phonetic: '/jɪə(r)/', pos: 'n.', meaning: '年', example: 'I am twelve years old.', exampleCn: '我十二岁了。' },
      { word: 'first', phonetic: '/fɜːst/', pos: 'adj.', meaning: '第一的', example: 'My first lesson is English.', exampleCn: '我的第一节课是英语。' }
    ],
    phrases: [
      { phrase: 'be from', meaning: '来自', example: 'I am from China.' },
      { phrase: 'how old', meaning: '多大', example: 'How old are you?' },
      { phrase: 'years old', meaning: '...岁', example: 'I am thirteen years old.' },
      { phrase: 'capital of', meaning: '...的首都', example: 'London is the capital of England.' }
    ],
    sentences: [
      { en: 'Where are you from?', cn: '你来自哪里？' },
      { en: 'I am from China.', cn: '我来自中国。' },
      { en: 'How old are you?', cn: '你多大了？' },
      { en: 'I am twelve years old.', cn: '我十二岁了。' },
      { en: 'Nice to meet you, everyone.', cn: '很高兴见到大家。' }
    ],
    text: {
      title: 'My Classmates',
      paragraphs: [
        {
          sentences: [
            { en: 'Hello, everyone. My name is Li Daming.', cn: '大家好。我叫李大明。', keywords: ['everyone', 'name'] },
            { en: 'I am twelve years old and I am from China.', cn: '我十二岁了，来自中国。', keywords: ['years old', 'from'] },
            { en: 'This is my friend, Tony Smith.', cn: '这是我的朋友，托尼·史密斯。', keywords: ['friend'] },
            { en: 'He is from England and he is English.', cn: '他来自英国，他是英国人。', keywords: ['England', 'English'] }
          ]
        }
      ]
    },
    grammar: {
      title: 'be动词与人称的搭配',
      points: [
        {
          rule: 'be动词am/is/are与不同人称搭配',
          detail: 'I搭配am，he/she/it搭配is，we/you/they搭配are。疑问句把be动词提前。',
          examples: ['I am from China.', 'She is twelve years old.', 'Are you English?', 'Where is he from?']
        }
      ]
    },
    exams: [
      {
        question: '—Where ___ you from? —I ___ from China.',
        options: ['A. are; am', 'B. is; am', 'C. are; is', 'D. is; are'],
        answer: 'A',
        explanation: '主语you搭配are，回答中I搭配am。'
      },
      {
        question: '—How old are you? —___',
        options: ['A. I am fine.', 'B. I am twelve.', 'C. I am a student.', 'D. Yes, I am.'],
        answer: 'B',
        explanation: '问"你多大了"，回答用年龄"我十二岁了"。'
      },
      {
        question: 'Beijing is the capital ___ China.',
        options: ['A. in', 'B. on', 'C. of', 'D. at'],
        answer: 'C',
        explanation: 'the capital of...表示"...的首都"，固定搭配。'
      }
    ]
  },
  {
    unitId: 'waiyan-7a-m2',
    title: 'Module 2: My family',
    topic: '家庭',
    words: [
      { word: 'father', phonetic: '/ˈfɑːðə(r)/', pos: 'n.', meaning: '父亲', example: 'My father is a teacher.', exampleCn: '我爸爸是一名老师。' },
      { word: 'mother', phonetic: '/ˈmʌðə(r)/', pos: 'n.', meaning: '母亲', example: 'My mother is a nurse.', exampleCn: '我妈妈是一名护士。' },
      { word: 'sister', phonetic: '/ˈsɪstə(r)/', pos: 'n.', meaning: '姐妹', example: 'I have a sister.', exampleCn: '我有一个妹妹。' },
      { word: 'brother', phonetic: '/ˈbrʌðə(r)/', pos: 'n.', meaning: '兄弟', example: 'My brother is tall.', exampleCn: '我哥哥很高。' },
      { word: 'grandfather', phonetic: '/ˈɡrænfɑːðə(r)/', pos: 'n.', meaning: '祖父', example: 'My grandfather is 70.', exampleCn: '我爷爷70岁了。' },
      { word: 'grandmother', phonetic: '/ˈɡrænmʌðə(r)/', pos: 'n.', meaning: '祖母', example: 'My grandmother is kind.', exampleCn: '我奶奶很和蔼。' },
      { word: 'uncle', phonetic: '/ˈʌŋkl/', pos: 'n.', meaning: '叔叔；舅舅', example: 'My uncle is a driver.', exampleCn: '我叔叔是一名司机。' },
      { word: 'aunt', phonetic: '/ɑːnt/', pos: 'n.', meaning: '阿姨；姑姑', example: 'My aunt is a doctor.', exampleCn: '我姑姑是一名医生。' },
      { word: 'job', phonetic: '/dʒɒb/', pos: 'n.', meaning: '工作', example: 'What is your father\'s job?', exampleCn: '你爸爸的工作是什么？' },
      { word: 'manager', phonetic: '/ˈmænɪdʒə(r)/', pos: 'n.', meaning: '经理', example: 'Her father is a manager.', exampleCn: '她爸爸是一名经理。' },
      { word: 'hotel', phonetic: '/həʊˈtel/', pos: 'n.', meaning: '旅馆', example: 'He works in a hotel.', exampleCn: '他在一家旅馆工作。' },
      { word: 'hospital', phonetic: '/ˈhɒspɪtl/', pos: 'n.', meaning: '医院', example: 'My mother works in a hospital.', exampleCn: '我妈妈在医院工作。' }
    ],
    phrases: [
      { phrase: 'work in', meaning: '在...工作', example: 'My father works in a hospital.' },
      { phrase: 'what about', meaning: '...怎么样', example: 'What about your mother?' },
      { phrase: 'a photo of', meaning: '一张...的照片', example: 'This is a photo of my family.' },
      { phrase: 'on the left', meaning: '在左边', example: 'My father is on the left.' }
    ],
    sentences: [
      { en: 'This is a photo of my family.', cn: '这是一张我家的照片。' },
      { en: 'My father is a teacher.', cn: '我爸爸是一名老师。' },
      { en: 'What is your mother\'s job?', cn: '你妈妈的工作是什么？' },
      { en: 'She works in a hospital.', cn: '她在医院工作。' },
      { en: 'My grandfather is on the left.', cn: '我爷爷在左边。' }
    ],
    text: {
      title: 'My Family',
      paragraphs: [
        {
          sentences: [
            { en: 'This is a photo of my family.', cn: '这是一张我家的照片。', keywords: ['photo', 'family'] },
            { en: 'My father is a hotel manager.', cn: '我爸爸是一名旅馆经理。', keywords: ['hotel manager'] },
            { en: 'My mother is a nurse at a hospital.', cn: '我妈妈是医院的一名护士。', keywords: ['nurse', 'hospital'] },
            { en: 'My grandfather is on the left and my grandmother is on the right.', cn: '我爷爷在左边，我奶奶在右边。', keywords: ['on the left', 'on the right'] }
          ]
        }
      ]
    },
    grammar: {
      title: 'this/that/these/those与名词所有格',
      points: [
        {
          rule: '名词所有格表示"某人的"',
          detail: '单数名词加\'s构成所有格，如father\'s, mother\'s。this/these介绍家人。',
          examples: ['This is my father\'s car.', 'What is your mother\'s job?', 'These are my parents.', 'That is my sister\'s bag.']
        }
      ]
    },
    exams: [
      {
        question: '—What is your father\'s ___? —He is a teacher.',
        options: ['A. name', 'B. job', 'C. age', 'D. hobby'],
        answer: 'B',
        explanation: '回答是职业"老师"，所以问的是工作job。'
      },
      {
        question: 'My mother ___ in a hospital.',
        options: ['A. work', 'B. works', 'C. working', 'D. to work'],
        answer: 'B',
        explanation: '主语my mother是第三人称单数，动词加s。'
      },
      {
        question: 'This is a photo ___ my family.',
        options: ['A. in', 'B. on', 'C. of', 'D. at'],
        answer: 'C',
        explanation: 'a photo of...表示"一张...的照片"，固定搭配。'
      }
    ]
  }
];
