import type { SupportedLanguage } from '../types/auth';

export interface Translations {
  systemTitle: string;
  systemSub: string;
  systemTagline: string;
  loginCardTitle: string;
  loginCardSubtitle: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  rememberMe: string;
  forgotPassword: string;
  loginButton: string;
  loggingIn: string;
  capsLockWarning: string;
  errors: {
    usernameRequired: string;
    usernameMinLength: string;
    passwordRequired: string;
    passwordMinLength: string;
    invalidCredentials: string;
    networkError: string;
  };
  demoPresets: {
    title: string;
    admin: string;
    prorab: string;
    operator: string;
  };
  securityBadge: string;
  copyright: string;
  supportHelp: string;
  forgotModal: {
    title: string;
    desc: string;
    inputLabel: string;
    inputPlaceholder: string;
    sendCode: string;
    sending: string;
    successSent: string;
    cancel: string;
  };
  dashboard: {
    welcome: string;
    role: string;
    logout: string;
    activeWells: string;
    currentDepth: string;
    dailyProgress: string;
    safetyRate: string;
    wellStatus: string;
    recentActivities: string;
    backToLogin: string;
  };
}

export const translations: Record<SupportedLanguage, Translations> = {
  uz: {
    systemTitle: "«O‘zbekneftgaz» AJ",
    systemSub: "Quduqlar qurilishi bo‘yicha ma’lumot",
    systemTagline: "Quduqlar qurilishi bo‘yicha ma’lumot",
    loginCardTitle: "Tizimga kirish",
    loginCardSubtitle: "Davom etish uchun hisob ma'lumotlaringizni kiriting.",
    usernameLabel: "Login",
    usernamePlaceholder: "Login",
    passwordLabel: "Parol",
    passwordPlaceholder: "Parolingizni kiriting",
    rememberMe: "Eslab qolish",
    forgotPassword: "Parolni unutdingizmi?",
    loginButton: "Kirish",
    loggingIn: "Tekshirilmoqda...",
    capsLockWarning: "Caps Lock yoqilgan — parol katta harflarda kiritilmoqda",
    errors: {
      usernameRequired: "Loginni kiritish majburiy",
      usernameMinLength: "Login kamida 3 ta belgidan iborat bo'lishi kerak",
      passwordRequired: "Parolni kiritish majburiy",
      passwordMinLength: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
      invalidCredentials: "Login yoki parol noto'g'ri kiritildi. Qaytadan urinib ko'ring.",
      networkError: "Server bilan aloqa o'rnatib bo'lmadi. Internetni tekshiring.",
    },
    demoPresets: {
      title: "Tezkor kirish (Demo hisoblar):",
      admin: "Administrator",
      prorab: "Bosh prorab",
      operator: "Operator",
    },
    securityBadge: "SSL 256-bit xavfsiz shifrlangan korporativ kanal",
    copyright: "2026 \"Uzbekneftgaz\" AJ. Raqamlashtirish departamenti",
    supportHelp: "Hisobingiz yo'qmi? Tizim administratoriga murojaat qiling.",
    forgotModal: {
      title: "Parolni tiklash",
      desc: "Hisobingizga biriktirilgan login, korporativ elektron pochta yoki telefon raqamingizni kiriting. Tasdiqlash kodi yuboriladi.",
      inputLabel: "Login, E-pochta yoki Telefon",
      inputPlaceholder: "admin@ung.uz yoki +998901234567",
      sendCode: "Tasdiqlash kodini yuborish",
      sending: "Yuborilmoqda...",
      successSent: "Tasdiqlash kodi ko'rsatilgan manzilga muvaffaqiyatli yuborildi!",
      cancel: "Bekor qilish",
    },
    dashboard: {
      welcome: "Xush kelibsiz",
      role: "Lavozim",
      logout: "Tizimdan chiqish",
      activeWells: "Faol burg'ulash uskunalari",
      currentDepth: "O'rtacha quduq chuqurligi",
      dailyProgress: "Sutkalik burg'ilash rejasi",
      safetyRate: "Xavfsizlik darajasi",
      wellStatus: "Quduqlar holati monitoringi",
      recentActivities: "Oxirgi operativ hodisalar",
      backToLogin: "Kirish sahifasiga qaytish",
    },
  },
  oz: {
    systemTitle: "УНГ БУРҒИЛАШ",
    systemSub: "«Ўзбекнефтгаз» АЖ",
    systemTagline: "Бурғилаш жараёнларини оператив бошқариш ва мониторинг қилиш ахборот тизими",
    loginCardTitle: "Тизимга кириш",
    loginCardSubtitle: "Тизимдан фойдаланиш учун ҳисоб маълумотларингизни киритинг",
    usernameLabel: "Фойдаланувчи номи ёки Логин",
    usernamePlaceholder: "Логин ёки телефон рақамингизни киритинг",
    passwordLabel: "Махфий парол",
    passwordPlaceholder: "Паролингизни киритинг",
    rememberMe: "Эслаб қолиш",
    forgotPassword: "Паролни унутдингизми?",
    loginButton: "Тизимга кириш",
    loggingIn: "Текширилмоқда...",
    capsLockWarning: "Диққат: Caps Lock ёқилган!",
    errors: {
      usernameRequired: "Фойдаланувчи номини киритиш мажбурий",
      usernameMinLength: "Логин камида 3 та белгидан иборат бўлиши керак",
      passwordRequired: "Паролни киритиш мажбурий",
      passwordMinLength: "Парол камида 6 та белгидан иборат бўлиши керак",
      invalidCredentials: "Логин ёки парол нотўғри киритилди. Қайтадан уриниб кўринг.",
      networkError: "Сервер билан алоқа ўрнатиб бўлмади. Интернетни текширинг.",
    },
    demoPresets: {
      title: "Тезкор кириш (Демо ҳисоблар):",
      admin: "Администратор",
      prorab: "Бош прораб",
      operator: "Оператор",
    },
    securityBadge: "SSL 256-бит хавфсиз шифрланган корпоратив канал",
    copyright: "2026 «Ўзбекнефтгаз» АЖ. Рақамлаштириш департаменти",
    supportHelp: "Техник кўмак: +998 (71) 207-27-72",
    forgotModal: {
      title: "Паролни тиклаш",
      desc: "Ҳисобингизга бириктирилган логин, корпоратив электрон почта ёки телефон рақамингизни киритинг. Тасдиқлаш коди юборилади.",
      inputLabel: "Логин, Э-почта ёки Телефон",
      inputPlaceholder: "admin@ung.uz ёки +998901234567",
      sendCode: "Тасдиқлаш кодини юбориш",
      sending: "Юборилмоқда...",
      successSent: "Тасдиқлаш коди кўрсатилган манзилга муваффақиятли юборилди!",
      cancel: "Бекор қилиш",
    },
    dashboard: {
      welcome: "Хуш келибсиз",
      role: "Лавозим",
      logout: "Тизимдан чиқиш",
      activeWells: "Фаол бурғилаш ускуналари",
      currentDepth: "Ўртача қудуқ чуқурлиги",
      dailyProgress: "Суткалик бурғилаш режаси",
      safetyRate: "Хавфсизлик даражаси",
      wellStatus: "Қудуқлар ҳолати мониторинги",
      recentActivities: "Охирги оператив ҳодисалар",
      backToLogin: "Кириш саҳифасига қайтиш",
    },
  },
  ru: {
    systemTitle: "УНГ БУРЕНИЕ",
    systemSub: "АО «Узбекнефтегаз»",
    systemTagline: "Информационная система оперативного управления и мониторинга процессов бурения",
    loginCardTitle: "Вход в систему",
    loginCardSubtitle: "Введите ваши учетные данные для авторизации в системе",
    usernameLabel: "Имя пользователя или Логин",
    usernamePlaceholder: "Введите логин или номер телефона",
    passwordLabel: "Пароль",
    passwordPlaceholder: "Введите ваш пароль",
    rememberMe: "Запомнить меня",
    forgotPassword: "Забыли пароль?",
    loginButton: "Войти в систему",
    loggingIn: "Проверка данных...",
    capsLockWarning: "Внимание: Включен Caps Lock!",
    errors: {
      usernameRequired: "Поле «Логин» обязательно для заполнения",
      usernameMinLength: "Логин должен содержать не менее 3 символов",
      passwordRequired: "Поле «Пароль» обязательно для заполнения",
      passwordMinLength: "Пароль должен содержать не менее 6 символов",
      invalidCredentials: "Неверный логин или пароль. Попробуйте еще раз.",
      networkError: "Не удалось подключиться к серверу. Проверьте сеть.",
    },
    demoPresets: {
      title: "Быстрый вход (Демо аккаунты):",
      admin: "Администратор",
      prorab: "Главный прораб",
      operator: "Оператор бурения",
    },
    securityBadge: "Корпоративное защищенное соединение SSL 256-бит",
    copyright: "2026 АО «Узбекнефтегаз». Департамент цифровизации",
    supportHelp: "Техническая поддержка: +998 (71) 207-27-72",
    forgotModal: {
      title: "Восстановление пароля",
      desc: "Укажите ваш логин, корпоративную почту или номер телефона. Мы отправим одноразовый код подтверждения.",
      inputLabel: "Логин, E-mail или Телефон",
      inputPlaceholder: "admin@ung.uz или +998901234567",
      sendCode: "Отправить код подтверждения",
      sending: "Отправка...",
      successSent: "Код подтверждения успешно отправлен!",
      cancel: "Отмена",
    },
    dashboard: {
      welcome: "Добро пожаловать",
      role: "Должность",
      logout: "Выйти из системы",
      activeWells: "Активные буровые установки",
      currentDepth: "Средняя глубина скважин",
      dailyProgress: "Суточный план проходки",
      safetyRate: "Уровень безопасности",
      wellStatus: "Мониторинг статуса скважин",
      recentActivities: "Последние оперативные события",
      backToLogin: "Вернуться на страницу входа",
    },
  },
  en: {
    systemTitle: "UNG DRILLING",
    systemSub: "JSC Uzbekneftegaz",
    systemTagline: "Information system for operational drilling management and field monitoring",
    loginCardTitle: "System Login",
    loginCardSubtitle: "Enter your corporate credentials to access the platform",
    usernameLabel: "Username or Login",
    usernamePlaceholder: "Enter your username or mobile number",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    loginButton: "Sign In",
    loggingIn: "Authenticating...",
    capsLockWarning: "Warning: Caps Lock is ON!",
    errors: {
      usernameRequired: "Username is required",
      usernameMinLength: "Username must be at least 3 characters",
      passwordRequired: "Password is required",
      passwordMinLength: "Password must be at least 6 characters",
      invalidCredentials: "Invalid username or password. Please try again.",
      networkError: "Could not establish connection to server. Check your network.",
    },
    demoPresets: {
      title: "Quick Login (Demo Accounts):",
      admin: "Administrator",
      prorab: "Chief Foreman",
      operator: "Field Operator",
    },
    securityBadge: "Enterprise grade 256-bit SSL encrypted channel",
    copyright: "2026 JSC Uzbekneftegaz. Digitalization Department",
    supportHelp: "Technical Support: +998 (71) 207-27-72",
    forgotModal: {
      title: "Password Recovery",
      desc: "Enter your registered login, corporate email, or phone number. A verification security code will be dispatched.",
      inputLabel: "Login, Email or Phone",
      inputPlaceholder: "admin@ung.uz or +998901234567",
      sendCode: "Send Verification Code",
      sending: "Sending...",
      successSent: "Verification code has been successfully dispatched!",
      cancel: "Cancel",
    },
    dashboard: {
      welcome: "Welcome back",
      role: "Designation",
      logout: "Sign Out",
      activeWells: "Active Drilling Rigs",
      currentDepth: "Average Well Depth",
      dailyProgress: "Daily Penetration Target",
      safetyRate: "HSE Compliance Score",
      wellStatus: "Well Status Real-Time Telemetry",
      recentActivities: "Recent Field Operations Log",
      backToLogin: "Back to Login Screen",
    },
  },
};
