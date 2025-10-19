cd /Users/moraine/PhpStormProjects/popoframework_slim/html_angular4
sed -i".bak" -e 's$href="/"$href="/cms/"$' src/index.html
ng build --env=flower_moraine
git checkout src/index.html
rsync -av dist/ 'da':/var/www/vhosts/flower_moraine/cms/
cd /Users/moraine/PhpStormProjects/popoframework_slim/
#rsync -av --exclude='vendor' --exclude='.git' --exclude='html_angular4' ./ 'da':/var/www/vhosts_lib/PopoframeworkSlimDawn/
