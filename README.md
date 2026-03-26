# Timetable.icu (あいしーゆーのじかんわり)
## 🚀 Project Structure

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```


## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun install`             | Installs dependencies                            |
| `bun dev`             | Starts local dev server at `localhost:4321`      |
| `bun build`           | Build your production site to `./dist/`          |
| `bun preview`         | Preview your build locally, before deploying     |
| `bun astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun astro -- --help` | Get help using the Astro CLI                     |
# 目標
- [ ] ようこに卒業までつかってもらう
- [ ] 100人のTermly Active UserをICU内で獲得する
    - [ ] Google / DuckDuckGoで「ICU 履修登録」「ICU 時間割」で1番目
    - [ ] iOSアプリ/Androidを作る (?)

# 大切にしたいこと
- [ ] とにかく時間割作成に使いやすいものである
    - [ ] long時間割対応 (しょうもないことだがアイデンティティ)
    - [ ] 軽量
- [ ] ICUらしくある
    - [ ] いろいろなものがひしめくリベラルアーツの感じを楽しく表現する
- [ ] プロジェクトとして持続可能なものである
    - [ ] 後輩に引き継ぐ前庭で作る，その価値があるものにする
    - [ ] オープンソース
    - [ ] ICUのいろいろな団体とコラボする
    - [ ] べきればCTLなどでも使ってもらいたい
    - [ ] 木越が責任を持って取り組む
    - [ ] 透明性のある予算と，ちゃんと収支均衡を取る

# ブランディング
- [ ]   名前
- [ ] Catalogue.icuはお名前comに奪われ3万の復旧費用. あくどい商売やで
- [ ] timetable.icu
- [ ] https://regi.icu/
- [ ] ロゴつくりなおす
    - [ ] 3Dみ
    - [ ] たぬき
- [ ] 開発者と顔を明示し，信頼を得る
- [ ] かわいいデザイン
    - [ ] 絵文字を多用するAI-Designに負けない!
- [ ] ちゃんとランディングページを作る: Astroのいいところ

# できること
- [ ] 時間割作成・保存
    - [ ] Long4 (カレンダー化)
    - [ ] マニュアル登録
    - [ ] Google Oauth + Passkey
    - [ ] Google Calendar / .icsエクスポート？
- [ ] 授業検索 (ICU Google OAuthを噛ませることで学生だけが閲覧出来るように)
- [ ] Feedback (他の人も見られる?)
    - [ ] Google Formにいかずとも簡単に送れるように
- [ ] [多言語対応](https://docs.astro.build/en/guides/internationalization/)
# できないこと
- [ ] 実際の履修登録 (リンク貼る)
- [ ] 卒業要件との照らし合わせ (リンク貼る)
- [ ] シラバスを見ること (リンク貼る)
- [ ] 授業評価を見ること (リンク貼る)
    - [ ] 見やすくして掲載は要検討

# 技術選定
## Frontend
- Astro
    - shadcn/ui?
    - mui/base?
    - API (BetterAuthまわりなど)もAstroで完結すれば最高; できないならHono
- BetterAuth (Google OAuth/Passkey)
## Infra
- Cloudflare Pages with Functions (Worker)
- D1

# 挑戦したいこと
- PR
    - 対面で宣伝
    - Instagram等でICU関連の団体/個人に宣伝してもらう
- コンポーネントテスト
- ちゃんとWebアナリティクスを取って開発の励みにする


# ライバル
- [ICUrriculum](https://icu-courses.com)
- Timetable4ICU

# 参考
- [Hupass](https://hupass.hu-jagajaga.com/)

---
# 工程表
- [ ] Astro App Initialise
- [ ] BetterAuth
    - [ ] Google OAuth + Passkey
-  [ ] 保存機能
    - [ ] Drizzle ORM
    - [ ] Schema定義
    - [ ] D1 Deploy
    - [ ] APIを書く on Astro or w/ Hono
- [ ] Calendar形式で表示

- [ ] Get Syllabi Data
- [ ] Deploy to Pages
- [ ] PR

## Schema案
- auth関連 (BetterAuthに任せる)
    - users
- user_courses (各ユーザの履修登録; もっと良いTable名は?)
    - 登録した courseのid
    - comment
    - academic year
    - term
- courses (授業情報)
    - 複合キー (course_code, year, term) ?
    - Title
    - RegID
    - Instructor
    - Course Number
    - Language
    - academic year
    - season
    - room?
- course_schedule
    - 別テーブルに予定を入れるため, 曜日毎の検索や1授業あたり複数の時間があるのを解決
    - day
    - start_at, end_at; or: period, isLong
- schedule: 休校日など?
- exam?
    - type (mid/final)
    - date
- categories
- メジャー，教職過程など, 1授業に複数あるもの
- course_categories: courses-categoriesを繋げる