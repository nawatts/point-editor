# point-editor

Place points on a map. Label them and move them around.

Mainly an excuse for me to learn about React and Redux.

Demo at http://www.nawatts.com/point-editor/

----

GitHub pages deployment process

```Shell
npm run build-prod
git checkout gh-pages
find . -depth 1 -type f ! -name ".gitignore" | xargs rm
mv build/* ./
git add .
git commit -m "Update demo"
git push -fu origin gh-pages
```
