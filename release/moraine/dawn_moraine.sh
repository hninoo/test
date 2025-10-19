cd /Users/moraine/PhpStormProjects/popoframework_slim/html_angular4
sed -i".bak" -e 's$href="/"$href="/cms/"$' src/index.html
ng build --env=dawn --output-hashing=all
git checkout src/index.html
rsync -av dist/ 'dsc-main':/var/www/vhosts/dawn.dsc-web.com/cms/
cd /Users/moraine/PhpStormProjects/popoframework_slim/
rsync -av --exclude='vendor' --exclude='.git' --exclude='html_angular4' ./ 'dsc-main':/var/www/vhosts_lib/PopoframeworkSlimDawn/
