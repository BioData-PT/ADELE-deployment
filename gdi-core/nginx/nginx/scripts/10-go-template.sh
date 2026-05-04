echo "Processing Go templates for includes"
for f in /etc/nginx/template_includes/*.tmpl; do
  name=$(basename "$f" .tmpl)
  echo "Processing template $f"
  gomplate -f "$f" -o "/etc/nginx/includes/$name"
done

echo "Processing Go templates for server confs"
for f in /etc/nginx/template_confs/*.tmpl; do
  name=$(basename "$f" .tmpl)
  echo "Processing template $f"
  gomplate -f "$f" -o "/etc/nginx/sites-enabled/$name"
done