# 障害レポート1  2026-04-07T8:52:00UTC
文責: 木越 斎 (itsukikigoshi@gmail.com)

時刻はすべてUTC
## 以下のmigrationが怪しい
18	0017_moaning_blonde_phantom.sql	2026-04-03 07:13:02
19	0018_past_franklin_richards.sql	2026-04-07 08:53:52
20	0019_left_timeslip.sql	2026-04-07 09:29:39

2026-04-07 8:52:00にはデータが存在
2026-04-07 8:55:00にuser_courses, session, passkeyデータが消失
- 犯人は0018_past_franklin_richards.sqlのmigration (ブランチの先頭にはいないがコミット済み#185b6caf)
    - 消えたデータはuser.id, { onDelete: "cascade" }というreferenceは貼ってあるもの
    - おそらく外部キー制約を完全に切ること無くmigrationが走ってしまったのだろう

## 対処
- 消えた後最新だった情報をnpx wrangler d1 export timetable-icu --remote --output=current_backup.sqlで保存
- user_courses, account, session, userに限りINSERT OR IGNORE INTOするように書き換え
    - 冒頭でPRAGMA foreign_keys = OFF;, 末尾にPRAGMA foreign_keys = ON;
- 2026-04-07 8:52:00時点のデータにnpx wrangler d1 time-travel restore timetable-icu --timestamp="2026-04-07T08:52:00Z"で戻る（実際はGUIを使用）
- 上記の最新データを流し込む
- 目視で，insertされたことを確認

## 反省
- time travelがなかったら終わってた
    - 今回の事態も，完全にアウト．データ復旧操作中に書き込まれたデータは保存されていない可能性がある．
- 安易に「大丈夫だろう」でmigrationしたのがよくなかった．
    - 今回のmigrationではcustom_coursesという本番では誰もデータを入れていないテーブルの操作だったので油断してた
- migration前には必ずバックアップするべし
    - bunx wrangler d1 export timetable-icu --remote --output=backup/past_data.sql
- Drizzleのmigrationファイルは完璧ではない
    - --> statement-breakpointでwrangler applyはPRAGMA foreign_keys = OFF;を勝手にONに戻してしまうことが原因か．
- migration時は事前のバックアップとローカルでの入念なテストを．
    - Time Travelは，本番への適用しか出来ず過去の一部分を書き出すこと（BigQueryの FOR SYSTEM_TIME AS OFなど）は出来ない．
- Neonならこのようなことが解決できるのか？
- SQLの勉強をしなければ.
  - AIに頼って.envファイルをGitHub Commitしたプログラマーとやっていることはほとんど変わらない．
  - 結局この対処もGeminiに頼っているわけだし．
- 実践するから学べるんだけど，ユーザがいる状態でデータを消したら取り返しがつかないので，そのせめぎあい．
  - バックアップをちゃんとしましょう．
  - 基礎を勉強しましょう．