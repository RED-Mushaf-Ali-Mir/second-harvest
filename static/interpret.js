/* Editable open-ended food list. No catalogue or dropdown limits food names. */
(() => {
  let counter = 0;
  const container = document.getElementById('food-rows');
  const conditions = [['unknown','Not sure'], ['raw','Fresh / raw / uncooked'],
    ['cooked','Cooked'], ['spoiled','Spoiled / moldy'], ['none','Nothing remains']];
  function count() {
    const n = container.children.length;
    document.getElementById('food-count').textContent = `${n} food${n === 1 ? '' : 's'} · up to 12 per batch`;
    document.getElementById('add-food').disabled = n >= 12;
  }
  function field(parent, labelText, element, className = '') {
    const wrap = document.createElement('div');
    wrap.className = className;
    const label = document.createElement('label');
    label.htmlFor = element.id;
    label.textContent = labelText;
    wrap.append(label, element);
    parent.append(wrap);
  }
  function add(item = {}, focus = true) {
    if (container.children.length >= 12) return;
    const id = ++counter;
    const row = document.createElement('div');
    row.className = 'food-row fade-in';
    const food = document.createElement('input');
    food.id = `food-${id}`; food.className = 'food-name';
    food.required = true; food.maxLength = 80;
    food.placeholder = 'Any food, e.g. mango'; food.value = item.food || '';
    const leftovers = document.createElement('input');
    leftovers.id = `leftovers-${id}`; leftovers.className = 'leftovers';
    leftovers.required = true; leftovers.maxLength = 300;
    leftovers.placeholder = 'e.g. seed, peel, rooted base'; leftovers.value = item.leftovers || '';
    const condition = document.createElement('select');
    condition.id = `condition-${id}`; condition.className = 'condition';
    for (const [value,label] of conditions) condition.add(new Option(label,value));
    condition.value = conditions.some(([value]) => value === item.condition) ? item.condition : 'unknown';
    field(row,'Food',food); field(row,'What remains?',leftovers,'leftover-field');
    field(row,'Leftover condition',condition);
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'remove'; remove.textContent = 'Remove';
    remove.addEventListener('click',() => {
      row.remove(); count();
      document.getElementById('add-food').focus();
    });
    row.append(remove); container.append(row); count();
    if (focus) food.focus();
  }
  function read() {
    const rows = [...container.children];
    if (!rows.length) throw new Error('Add at least one food before continuing.');
    return rows.map(row => {
      const food = row.querySelector('.food-name').value.trim();
      const leftovers = row.querySelector('.leftovers').value.trim();
      if (!food || !leftovers) throw new Error('Give each row a food name and leftover description.');
      return {food,leftovers,condition:row.querySelector('.condition').value};
    });
  }
  document.getElementById('add-food').addEventListener('click',() => add());
  window.FoodEditor = {read, count, add, set(items) {
    container.replaceChildren(); items.forEach(item => add(item,false)); count();
  }};
})();
