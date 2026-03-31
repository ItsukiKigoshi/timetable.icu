export const languages = {
    en: 'English',
    ja: '日本語',
};

export const defaultLang = 'en' as const;

export const ui = {
    en: {
        'title': 'Timetable.icu',
        // Meta
        'site.title': 'ICU Timetable | The Ultimate Course Registration Tool',
        'site.description': 'Plan your academic life at ICU with ease!',
        // Auth
        'auth.login': 'Login',
        'auth.logout': 'Logout',
        'auth.logging_out': 'Logging out...',
        'auth.login_google': 'Login with Google',
        'auth.connecting_google': 'Connecting to Google...',
        'auth.error_login': 'Failed to login',
        'auth.passkey.add': 'Add Passkey',
        'auth.passkey.adding': 'Adding Passkey...',
        'auth.passkey.login': 'Login with Passkey',
        'auth.passkey.logging_in': 'Authenticating...',
        'auth.passkey.name_prompt': 'Name for this Passkey?',
        'auth.passkey.success_add': 'Passkey registered!',
        'auth.passkey.error_login': 'Authentication failed.',
        'auth.passkey.error_add_hint': 'Failed to add Passkey. If you haven\'t registered yet, please login with Google first.',
        // Error
        'error.db.title': 'Access Restricted',
        'error.db.description': 'Database limit reached. Please try again later.',
        // Navigation
        'nav.explore': 'Explore',
        'nav.timetable': 'Timetable',
        // Header
        'header.welcome_back': 'Welcome back!',
        'header.hi': 'Hi, {name}!',
        'header.synced': 'Synced',
        'header.login_to_sync': 'Login to sync',
        'term.Spring': 'Spring',
        'term.Autumn': 'Autumn',
        'term.Winter': 'Winter',
        // --- Landing Page ---
        'lp.hero.subtitle': 'Welcome!',
        'lp.hero.description': 'Your academic planning, simplified.',
        'lp.nav.explore': 'Explore Courses',
        'lp.nav.timetable': 'View Timetable',
        // Features - Can
        'lp.features.can.label': 'Features',
        'lp.features.can.search.title': 'Search All Courses',
        'lp.features.can.search.desc': 'Search through every course retrieved from the official syllabus.',
        'lp.features.can.schedule.title': 'ICU-Specific Schedules',
        'lp.features.can.schedule.desc': 'Support for ICU-unique periods like Long 4, 5, 6, and 7.',
        'lp.features.can.sync.title': 'Multi-Device Sync',
        'lp.features.can.sync.desc': 'Log in to sync your latest timetable across all your devices.',

        // Features - Todo
        'lp.features.todo.label': 'Coming Soon',
        'lp.features.todo.offline.title': 'Offline Mode',
        'lp.features.todo.offline.desc': 'An internet connection is currently required to view courses.',
        'lp.features.todo.custom.title': 'Custom Course Entry',
        'lp.features.todo.custom.desc': 'Currently official courses only. Custom entry is being planned.',
        'lp.features.todo.calendar.title': 'Calendar Integration',
        'lp.features.todo.calendar.desc': 'Exporting to external calendars (Google, etc.) is under consideration.',

        // Profile
        'lp.profile.made_with': 'Made with ♥ by',
        'lp.profile.description.top': "With love from ICU '27 🏔️",
        'lp.profile.description.middle': 'We are looking for contributors!',
        'lp.profile.description.bottom': 'If you are interested in design, PR, or coding, please ',
        'lp.profile.contact': 'contact us',
        'lp.profile.dot': '.',

        // Footer
        'footer.privacy': 'Privacy Policy',
        'footer.terms': 'Terms of Service',
    },
    ja: {
        'title': 'ICUのじかんわり',

        'site.title': 'ICUのじかんわり | 時間割・履修登録ツールの決定版',
        'site.description': "'ICUのじかんわり'を使えば，複雑な時間割・履修登録もお手の物!",
        'auth.login': 'ログイン',
        'auth.logout': 'ログアウト',
        'auth.logging_out': 'ログアウト中...',
        'auth.login_google': 'Googleでログイン',
        'auth.connecting_google': 'Googleへ接続中...',
        'auth.error_login': 'ログインに失敗しました',
        'auth.passkey.add': 'Passkeyを追加',
        'auth.passkey.adding': 'Passkeyを登録中...',
        'auth.passkey.login': 'Passkeyでログイン',
        'auth.passkey.logging_in': 'Passkeyで認証中...',
        'auth.passkey.name_prompt': 'Passkeyの名前はどうしますか？',
        'auth.passkey.success_add': 'Passkeyを登録しました！',
        'auth.passkey.error_login': 'ログインに失敗しました。',
        'auth.passkey.error_add_hint': 'Passkeyの登録に失敗しました。まだ登録していない場合は、まずGoogleでログインしてください。',
        'error.db.title': 'アクセス制限中',
        'error.db.description': 'データベースの読み取り制限に達しています．',
        // ヘッダー
        'header.welcome_back': 'おかえりなさい',
        'header.hi': '{name} さん、こんにちは！',
        'header.synced': '同期済み',
        'header.login_to_sync': 'ログインして同期',
        'term.Spring': '春学期',
        'term.Autumn': '秋学期',
        'term.Winter': '冬学期',
        // ナビゲーション
        'nav.explore': '探す',
        'nav.timetable': '時間割',
        // --- ランディングページ ---
        'lp.hero.title': 'ICUのじかんわり',
        'lp.hero.subtitle': 'へようこそ！',
        'lp.hero.description': 'ICU生の時間割・履修計画がここに.',
        'lp.nav.explore': 'コースを探す',
        'lp.nav.timetable': '時間割を見る',
        // できること
        'lp.features.can.label': 'できること',
        'lp.features.can.search.title': 'すべてのコースから探す',
        'lp.features.can.search.desc': '公式授業一覧から取得されたすべてのコースを検索',
        'lp.features.can.schedule.title': 'ICU独自のスケジュールに対応',
        'lp.features.can.schedule.desc': 'Long 4, 5, 6, 7など、ICUならではのコマ割りも表示',
        'lp.features.can.sync.title': 'マルチデバイス同期',
        'lp.features.can.sync.desc': 'ログインしてすべてのデバイスで最新の時間割を共有',

        // 検討中
        'lp.features.todo.label': '検討中',
        'lp.features.todo.offline.title': 'オフライン表示',
        'lp.features.todo.offline.desc': '閲覧にはインターネット接続が必要',
        'lp.features.todo.custom.title': '独自コースの追加',
        'lp.features.todo.custom.desc': '現在は公式提供コースのみ。カスタム追加機能も検討中',
        'lp.features.todo.calendar.title': 'カレンダー連携',
        'lp.features.todo.calendar.desc': '外部カレンダーへの書き出し機能を検討中',

        // プロフィール
        'lp.profile.made_with': 'Made with ♥ by',
        'lp.profile.description.top': "ICU '27が愛を込めてお届け🏔️",
        'lp.profile.description.middle': '開発協力者を募集中！',
        'lp.profile.description.bottom': 'デザイン，広報，コーディングなどに興味がある方はぜひ',
        'lp.profile.contact': 'ご連絡',
        'lp.profile.dot': 'を.',

        // フッター
        'footer.privacy': 'プライバシーポリシー',
        'footer.terms': '利用規約',
    },
} as const;