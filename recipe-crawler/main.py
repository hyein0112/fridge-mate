import requests
from bs4 import BeautifulSoup
import json
import re
import time

BASE_URL = 'https://www.10000recipe.com'
RANKING_URL = f'{BASE_URL}/ranking/home_new.html'


def get_recipe_links():
    res = requests.get(RANKING_URL)
    soup = BeautifulSoup(res.text, 'html.parser')
    links = []
    for a in soup.select('.common_sp_link'):
        href = a.get('href')
        if href and href.startswith('/recipe/'):
            links.append(BASE_URL + href)
        if len(links) >= 50:
            break
    return links


def parse_recipe(url):
    res = requests.get(url)
    soup = BeautifulSoup(res.text, 'html.parser')
    name = soup.select_one('.view2_summary h3').get_text(strip=True)
    image = soup.select_one('.centeredcrop img')['src'] if soup.select_one('.centeredcrop img') else ''
    # 재료 추출
    ingredients = []
    for li in soup.select('.ready_ingre3 ul li'):
        txt = li.get_text(strip=True)
        if txt:
            m = re.match(r'(.+?)\s+([\d\w]+)$', txt)
            if m:
                ingredients.append({'name': m.group(1), 'quantity': m.group(2), 'isAvailable': False})
            else:
                ingredients.append({'name': txt, 'quantity': '', 'isAvailable': False})
    # 조리법 추출
    instructions = [p.get_text(strip=True) for p in soup.select('.view_step_cont')]
    # 태그 추출
    tags = [tag.get_text(strip=True) for tag in soup.select('.tag_cont a')]
    return {
        'name': name,
        'ingredients': ingredients,
        'instructions': instructions,
        'cookingTime': 30,
        'difficulty': 'medium',
        'servings': 2,
        'tags': tags,
        'image': image
    }


def main():
    print('레시피 링크 수집 중...')
    links = get_recipe_links()
    print(f'{len(links)}개 레시피 링크 수집 완료')
    recipes = []
    for i, url in enumerate(links):
        print(f'{i+1}/{len(links)}: {url}')
        try:
            recipe = parse_recipe(url)
            recipes.append(recipe)
        except Exception as e:
            print(f'Error parsing {url}: {e}')
        time.sleep(1)  # 서버 부하 방지
    with open('recipes.json', 'w', encoding='utf-8') as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)
    print('recipes.json 저장 완료!')


if __name__ == '__main__':
    main() 