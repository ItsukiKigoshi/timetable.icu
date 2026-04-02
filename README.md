# ICUのじかんわり | Timetable.icu

# 目標

<!-- - [ ] ようこに卒業までつかってもらう -->

- [ ] 100人のTermly Active UserをICU内で獲得する
    - [ ] Google / DuckDuckGoで「ICU 履修登録」「ICU 時間割」「ICU academic planning」「ICU registration」で1番目
    - [ ] iOSアプリ/Androidを作る (?)

# 大切にしたいこと

- [ ] とにかく時間割作成に使いやすいものである
    - [x] long時間割対応 (しょうもないことだがアイデンティティ) 
    - [ ] 軽量 (めざせ 全ページPageSpeedInsights 100)
- [ ] ICUらしくある
    - [ ] いろいろなものがひしめくリベラルアーツの感じを楽しく表現する
    - [x] 隠し要素
- [ ] プロジェクトとして持続可能なものである
    - [ ] 後輩に引き継ぐ前提で作る，その価値があるものにする
    - [x] オープンソース
    - [ ] ICUのいろいろな団体とコラボする
    - [ ] できればCTLなどでも使ってもらいたい
    - [ ] 木越が責任を持って取り組む
- [ ] Transparency
    - [ ] Share Issues, Feature Requests
    - [ ] 透明性のある予算と，ちゃんと収支均衡を取る

# ブランディング

- [x] 名前
    - timetable.icu $7.20 Renews at $14.20
        - [x] ICUのじかんわり
        - [x] Timetable.icu
- [x] ロゴつくりなおす
    - [x] 3Dみ
    - [x] たぬき
- [x] 開発者と顔を明示し，信頼を得る
- [x] かわいいデザイン
    - [x] 絵文字を多用するAI-Designに負けない!
- [x] ちゃんとランディングページを作る: Astroのいいところ
- [x] SEO
    - [ ] リッチリザルト?

# できること

- [x] 時間割作成・保存
    - [x] Long4 (カレンダー化)
    - [ ] マニュアル登録
    - [x] Google Oauth + Passkey
    - [ ] Google Calendar / .icsエクスポート？
- [x] 授業検索 (ICU Google OAuthを噛ませることで学生だけが閲覧出来るように)
    - [ ] 空きコマに入る授業検索: query paramを`&dayPeriod=["M-2"and"T-1"]`みたいに持たせる？
- [ ] FeatureRequest/Feedback (他の人も見られる?)
    - [ ] Google Formにいかずとも簡単に送れるように
    - [ ] With Upvote
- [x] 多言語対応

# できないこと

- [ ] 実際の履修登録 (リンク貼る)
    - [ ] Registration Website
- [ ] 卒業要件との照らし合わせ (リンク貼る)
    - [ ] Grad Requirement Checklist
    - [ ] 卒業要件PDF (ehandbook)
- [x] シラバスを見ること
    - [x] リンク貼る
- [ ] 授業評価（TES）を見ること (リンク貼る)
    - [ ] 見やすくして掲載は要検討
    - [ ] TODO - Over Year TES解析 (RegIDが違うのでまずは経年でコースを統合(instructorとcorusenoが一致する?)して解析; Python)
        - [ ] 経年評価や同一講師の授業評価を可視化
- [ ] オフラインで確認すること
    - [ ] 代わりに: Apple/Google Calendarへのエクスポート
    - [ ] 代わりに: スクショしやすい画面配置

# 挑戦したいこと

- [ ] PR
    - [ ] 対面で宣伝
    - [ ] Instagram等でICU関連の団体/個人に宣伝してもらう
    - [ ] 受験生にリーチ
        - [ ] 「こんなサイトを学生が作る大学なんだ！」+入学後に使ってもらう
- コンポーネントテスト
- [x] ちゃんと[Webアナリティクス](https://www.cloudflare.com/application-services/products/analytics/)を取って開発の励みにする

# ライバル

- [ICUrriculum](https://icu-courses.com)
- [Timetable4ICU](https://www.timetable4icu.com/)
- すごい時間割
- Penmark

# 参考

- [Hupass](https://hupass.hu-jagajaga.com/)
- [現在の時間割](https://www.icu.ac.jp/news/2406181000.html)
- Twinte
- [Webサービス公開前のチェックリスト](https://zenn.dev/catnose99/articles/547cbf57e5ad28)

---

# 工程表

- [x] Astro App Initialise
- [x] BetterAuth
    - [x] Google OAuth
    - [x] Passkey
        - ~~[ ] Session情報最適化 (KV/JWT?; 毎RequestでWorkersに行かなくてもいいようにできる?)~~:
          とりあえずはmiddlewareの情報を使って最適化できそう
- [x] Get Syllabi Data
    - [x] ブラウザ保存->Pythonパース？
    - [x] Pythonで完結
    - [ ] 定期的に自動で: GitHub CI/CD
- [ ] 時間割
    - [x] Calendar形式で表示
        - [x] Termセレクター
        - [x] 表示をSophisticate
          ~~- [ ] クリック時の挙動は, カレンダーアプリなどと同様にその1つのイベントにdropdownが出てくるのが良い？~~:
          スマホ操作を考えるなら今の挙動が良い
            - [x] 開始時間->CorseID タイトル->場所かな
            - [x] Roomを表示するのはログイン済みユーザだけ！
        - [ ] 理系の選択式の演習UI: 優先度低し
    - [x] 保存機能
        - [x] Drizzle ORM
        - [x] Schema定義
        - [x] D1 Deploy
        - [x] 未ログインユーザはLocalStorageへ
            - [x] LocalStorageがSaveされたときに通知
    - [x] show/hide機能
        - [x] Listにだけ表示されるようにする
        - [x] もしくは時間割上に網線で表示される（+"非表示の授業は単位数にカウントされません"みたいなメッセージ）か
        - [x] user courses schemaに追加（boolean; 0/1）
    - [x] List形式で表示
    - [ ] Google Calendar / .icsエクスポート？
        - [ ] 授業開始日と終了日
        - [ ] 休講日を除く
- [x] 授業検索
    - [x] 全体の条件クリアボタン（year, term以外）
    - [x] キーワード検索にCourse ID, regidを含む!
    - [ ] **キャンセルされた授業をそのように明示: 追加できないように**
        - [ ] 現状では非表示
    - [ ] **開講言語**
        - [ ] 絞り込み機能
    - [ ] Foundation, Area Majorの絞り込み
        - [ ] CourseCodeを「アルファベット」(String 3-4文字）と「数字」（0-999; 数字として保存してフロントで3文字に加工）の方が良い？
        - [ ] そもそも100から始まればfoundation, 2-300から始まればarea major?そのルールは絶対？
        - [ ] SELECT * FROM courses WHERE course_code GLOB '[A-Z][A-Z][A-Z]1[0-9][0-9]';
          のようにGLOBを使えばワイルドカードで100番台は持ってこられる
        - [ ] 一番確実なのは公式の結果をそのまま挿入することだが，なるべくやりたくない: colistはこれをやらざるをえないかも
    - [x] メジャーとそれ以外を分離, もしくはタグ形式で
    - [ ] Issue: Co-Listに非対応; ehandbookを参照しながらColistが何かを解説
      ~~- [ ] コマをクリックでその時間の授業を検索~~
      ~~- [ ] 授業詳細: Dialogueか個別ページ (Dynamic Routing)~~: とりあえず Not Planned
    - [ ] 空きコマ検索
    - [ ] slots(この名称もscheduleにするべき？)が2つ以上なら空きコマ検索モードにする？
        - [ ] デフォルトでは1slotしかUIで選択出来ないようにし，「クリア」と「閉じる」の間の「□空きコマを探す(?)
          」をチェックすると複数コマが選択できるようになる
            - [ ] 既にコースが登録されていれば勝手にスケジュールを入れてくれる
            - [ ] 「選択したスケジュールで履修できるコマを表示します」などヘルプメッセージを入れる
    - [ ] 選択したコマ以外にscheduleを持たない授業を検索するオプション(
      「選択していないすべてのコマが，scheduleに含まれない」=「選択したコマだけがscheduleに含まれる」)
    - [ ] もしくはdefaultではOR検索(使う場面あるか？)
    - [ ] 時間割ページから飛べるように
- [x] 体育にも対応した単位数表示
    - [x] DB
        - [x] Schema追加
        - [x] HTMLからJSON (Python)
        - [x] JSONからSQL (Python; SQLでのデータ追加が必要なのはremoteだけ？)
        - [x] Localに追加
        - [x] Remoteに追加
    - [x] 検索
        - [x] 表示
        - [x] 絞り込み（上限・下限; スライダ?）
    - [x] 時間割
        - [x] 表示
        - [x] 合計単位数表示（体育どうする！）
- [ ] 独自スケジュール
    - [x] DB定義
    - [ ] 追加方法
    - [ ] 表示方法
    - [x] メモ
    - [ ] カスタム色追加
    - [ ] 検索: Scheduleがない授業の追加を許可（Listがあるので現在でも追加して良いっちゃ良い）
- [ ] テスト
    - [ ] 時間割
        - [ ] 様々なデータで描画
    - [ ] データ
        - [ ] ローカルからのsync
    - [ ] DB
        - [ ] SQL Injection対策
        - [ ] SQL EXPLAINで実行計画を管理（READ数が爆発しないように）
- [ ] Catalogue.icuで移行を促すMessage
    - [ ] 移行機能 (直接新アプリのAPIを叩く?)
- [ ] Refactor
    - [ ] Componentがごちゃごちゃしている．絶対必要!
    - [ ] Long4まわりの表示をSophisticate, refactor
    - [ ] useTimetableの挙動: そもそもHooks必要?
    - [ ] WorkersならPreactの方が良い？
- [ ] Design
    - [x] カラーテーマ当てる
    - [x] コンポーネントの丸みなど調整する
    - [ ] Storybookなどcomponent test?
    - [ ] AIみの排除
        - [x] グラデーション
        - [x] アニメーション
        - [x] ボーダー
        - [x] 背景色
        - [x] 安易にtransparent/opacityいじらない
        - [ ] フォント（こだわろう; 明朝?）
        - [ ] 他のAIみの少ないサイトを参照
            - [x] ICUで撮った写真をフォトフレームみたいにして入れると人間らしくなるのでは？
            - [x] landingpageのみSSG?
- [ ] Landing Page
    - [x] 背景画像最適化: そもそもブラーをかけておく，画質落とす
    - [x] できることとできないことを明示
        - [x] まずはじめに「授業を検索して」「時間割を作れる」という基本機能をかくべき！（できればスクショ付きで？）
        - [x] 検索->時間割（複数のコマから比較できるよ）->同期
    - [ ] オープンソース: **ソースコードへのリンクを掲載**
    - [ ] QA
        - [ ] なぜつくったの？
            - [ ] 複数の授業を比較しながら履修を考えるため
            - [ ] Long4
            - [ ] 誰が運営？
            - [ ] 他Twinte参照
    - [ ] 会計開示
        - [ ] Cloudflare Registrar
        - [ ]  寄付受付
            - [ ] OpenCollective, Stripe
    - [ ] Members
        - [x] 自己紹介
        - [x] リンク
        - [x] Join the Team!
            - [x] 連絡用のメールアドレス
                - [ ] 独自domain
            - [ ] Form?
- [ ] ログイン時にユーザの操作でログインが中止された状態をフロントで拾う
- [ ] LocalStorageから同期後の通知で，ちゃんとデータが統合されたことを明示
    - [x] Snack通知
    - [ ] 失敗時のログ（LocalStorageに格納）と手動同期ボタン
- [x] [多言語対応](https://docs.astro.build/en/guides/internationalization/)
    - [x] Default localeをjaとenどっちにするか？
    - [x] おそらく利用者の母語はほとんど日本語だが，英語も分かる．逆に，一部に英語は分かるが日本語が苦手な人もいる．
- [x] Google OAuthをpublesh
    - [x] Privacy Policy
        - [ ] わかりやすく
    - [x] 利用規約
        - [ ] わかりやすく
        - [ ] ポチポチして利用規約つくれるサイト？
        - [ ] 卒業後のアカウント削除に関する規程
            - [ ] ログインの履歴とのれがPasskeyかGoogleかはlogで分かる？
    - [x] [サイトの所有権を確認する](https://support.google.com/webmasters/answer/9008080?hl=ja&sjid=3952852442816250357-NC)
        - [x] [Google Search Console](https://search.google.com/search-console)
- [ ] Known Issues: リリースまでに反映もしくは注意書き
    - [ ] 退会方法を設ける
    - [ ] スケジュールがない授業を追加できない
- [ ] SEO
    - [x] meta description
    - [ ] リッチリザルト
        - [ ] パンくず
    - [x] タイトルつける
    - [x] OGP
        - [x] og:title
        - [x] og:description
        - [x] og:url
        - [x] og:image
            - [ ] よいもの？
    - [x] Google Search Console
    - [ ] Semantic HTML
        - [ ] div乱用をrefactor
- [x] Deploy to Workers
- [ ] リンク
    - [ ] 学年暦
    - [ ] 4年間の全体像を考える
    - [ ] ログインが必要なサイトはその旨を明示
    - [ ] 「どうやって履修計画を立てたらいいか分からない？でも大丈夫！ICUにはあなたの履修をサポートする窓口がたくさんあります！」
    - [ ] ICU Portal
    - [ ] ICU Map
        - [ ] Course Offerings
    - [ ] CTL
        - [ ] 履修計画テンプレート
        - [ ] 履修計画ワークショップ
        - [ ] イベントなどでコラボレーション？
    - [ ] Major一覧
        - [ ] ehandbook
        - [ ] メジャーインフォメーションサイト
        - [ ] メジャー選択要件
    - [ ] ICU IBS
        - [ ] 相談方法
        - [ ] Social Media
    - [ ] Weekly Giants
    - [ ] 選択肢を提示する意味でICUrriculumやTimetable4ICUも載せる？
    - [ ] トップページのロード速度は落とさぬように．
- [ ] performance
    - [x] 画像最適化: 必要なピクセル数以下に抑える
- [ ] 表示するコマが無いときに「Explore」へ促す
- [ ] PR
    - [ ] Zenn記事
        - [ ] Drizzle, BetterAuth, D1
    - [ ] Weekly Giant寄稿

## 課題

- [ ] 卒業後にログインできなくなる
    - [ ] 卒業後にアカウントが削除できなくなる
    - [ ] 対策として， 最終ログイン後から数年/IDの卒業年によるアカウント削除や，第2メールアドレスを持たせる？
    - [ ] 大学院進学でメールアドレスが変わると使えなくなる?
- [ ] 逆に現状だと，Passkeyを持っていれば卒業後も在学生以外にアクセスさせたくない情報 (Room)が見られてしまう

## Checklist

- [x] Roomはicu.ac.jpを持つユーザのみ
    - [ ] 未ログインユーザーにはAPIからも返さない!!

---

# Development

## 技術選定

### Frontend

- Astro
- Tailwindcss
- DaisyUI

### Backend

- Astro
- BetterAuth (Google OAuth/Passkey)

### Infra

- Cloudflare Pages with Functions (Worker)
- D1

## 🚀 Project Structure

```text
/
├── public/
│   └── favicon.svg
├── migrations/
│   └── migration.sql
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Component.astro
│   ├── layouts
│   │   └── Layout.astro
│   ├── lib
│   │   └── auth.ts // schema definitions, auth-related files
│   ├── pages
│   │   └── index.astro
│   ├── styles
│   │   └── global.css
│   ├── env.d.ts // Type for Astro
│   └── middleware.ts
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command               | Action                                           |
|:----------------------|:-------------------------------------------------|
| `bun install`         | Installs dependencies                            |
| `bun dev`             | Starts local dev server at `localhost:4321`      |
| `bun run build`       | Build your production site to `./dist/`          |
| `bun preview`         | Preview your build locally, before deploying     |
| `bun astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun astro -- --help` | Get help using the Astro CLI                     |

Create types from wrangler.jsonc

```bash
bunx wrangler types
```

### Schema Definition, Migration

Create schema for BetterAuth

```bash
bun x auth@latest generate --config=./src/lib/auth-cli.ts --output=./src/db/auth-schema.ts
```

Create schema by Drizzle Kit

```bash
bun x drizzle-kit generate
```

Migration to D1 (--remote if applicable)
Local->Remoteの順で1つずつ実行しないとエラーがでるときがある

```bash
bun wrangler d1 migrations apply timetable_icu
bun wrangler d1 migrations apply timetable_icu --remote
```

もし外部キー制約が通らない場合

```shell
bun wrangler d1 execute timetable_icu --remote --file=./migrations/0012_smart_mojo.sql
```

などとしてmigration出来るが，これではD1のmigration履歴が残らないため，上記execute後に上記
sqlファイルの中身を一旦空にしてapplyする方法がある．推奨されてはいなさそう．

Debug with Cloudflare Environment

```bash
bun run build && bun x wrangler dev
```

### Corse data insertion

Create JSON from HTML

```bash
bun db:scrape
```

Local DBにJSONからcourses/categoriesを入れる(seed.ts)

```bash
bun db:seed:local
```

HTML->JSON->Local DBを一括で実行

```bash
bun db:sync
```

Remote DBにJSONからcourses/categoriesを入れる(seed.ts)

```bash
bun db:push:remote
```

HTML->JSON->Remote DBを一括で実行

```bash
bun db:deploy
```

ライセンス出力

```bash
bun x generate-license-file --input package.json --output LICENSE.md
```

リモートのログ出力

```bash
bun wrangler tail
```

## Schema案

- [x] auth関連 (BetterAuthに任せる)
    - users
- [x] user_courses (各ユーザの履修登録; もっと良いTable名は?)
    - 登録した courseのid
    - comment
    - academic year
    - term
- [x] courses (授業情報)
    - 複合キー (course_code, year, term) ?
    - Title
    - RegID
    - Instructor
    - Course Number
    - Language
    - academic year
    - season
    - room?
- [x] course_schedule
    - 別テーブルに予定を入れるため, 曜日毎の検索や1授業あたり複数の時間があるのを解決
    - day
    - start_at, end_at; or: period, isLong
- schedule: 休校日など?
  - [ ]exam?
    - type (mid/final)
    - date
- [x] categories
    - メジャー，教職過程など, 1授業に複数あるもの
- [x] course_categories: courses-categoriesを繋げる

# メモ

## 名称案

- Catalogue.icuはお名前comに奪われ3万の復旧費用. あくどい商売やで
- timetable.icu $7.20 Renews at $14.20
    - ICUのじかんわり
    - Timetable.icu
- icutime.com $10.46Renews at $10.46
- table.icu $89.20 Renews at $178.20
- syllabus.icu $12.20 Renews at $12.20
- ICUのレシピサイト
    - Cuisine.icu $12.20 Renews at $12.20
    - recipe.icu unavailable
    - gourmet.icu $29.20 Renews at $58.20
    - dish.icu $29.20 Renews at $58.20
    - kitchen.icu is not available
    - cook.icu $89.20Renews at $178.20
- .icuドメインにこだわるとブランド命名の幅が狭まる.
    - SEOも弱い?
    - .icuというドメインは，ICUの公式サイトであるように（良くも悪くも）誤認されやすい
- 「まずはここから」
    - starter.icu $12.20 Renews at $12.20
    - starterkit.icu $12.20 Renews at $12.20
- 天体観測
    - stargazer.icu unavailable
    - planet.icu $29.20Renews at $58.20
- ICUっぽさ
    - Bakayama.icu unavailable
    - bakayama.com $10.46Renews at $10.46
    - sekume.icu $12.20 Renews at $12.20
    - coursemate.icu $12.20 Renews at $12.20
    - ahoyama.icu $12.20 Renews at $12.20
    - donguri.icu $12.20 Renews at $12.20
    - dongry.icu 11.20 (12.20)
    - land.icu $29.20Renews at $58.20
    - why.icu unavailable
    - forest.icu $29.20Renews at $58.20
    - mori.icu unavailable
    -
- 色々
    - story.icu unavailable
    - render.icu unavailable
    - overview.icu unavailable
    - look4.icu $12.20 Renews at $12.20
    - good4.icu $12.20Renews at $12.20
    - time2.icu $12.20Renews at $12.20
    - go4.icu unavailable
    - ilove.icu unavailable
    - madein.icu $12.20Renews at $12.20
    - made4.icu $12.20Renews at $12.20
    - what.icu unavailable
    - belong2.icu $12.20Renews at $12.20
    - easyregi.icu $12.20Renews at $12.20
    - chef.icu $287.70Renews at $575.20
    - at.icu $89.20Renews at $178.20
- 絵を書く
    - canvas.icu $29.20Renews at $58.20
    - palette.icu $29.20Renews at $58.20
- 参考:
    - Twinte (筑波)
    - Hupass (北大)
    - [Berkeleytime.com](https://berkeleytime.com/grades) (Berkeley)
    - Penmark
