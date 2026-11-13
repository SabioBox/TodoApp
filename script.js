// DOM 요소 참조
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const categorySelect = document.getElementById('category-select');
const searchInput = document.getElementById('search-input');
const todoList = document.getElementById('todo-list');
const filterButtons = document.querySelectorAll('.filter-btn');
const progressText = document.getElementById('progress-text');
const progressBarFill = document.getElementById('progress-bar-fill');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

// 카테고리 명칭 매핑
const CATEGORIES = {
  work: '업무',
  personal: '개인',
  study: '공부'
};

// 현재 선택된 필터 상태 ('all', 'work', 'personal', 'study')
let currentFilter = 'all';

// 현재 검색어 상태
let searchKeyword = '';

// localStorage에서 할 일 목록 불러오기 (기존 데이터의 경우 category 기본값을 'personal'로 보정)
let todos = (JSON.parse(localStorage.getItem('todos')) || []).map((todo) => ({
  ...todo,
  category: todo.category || 'personal'
}));

// localStorage에 할 일 목록 저장
function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

// 진행률 업데이트
function updateProgress() {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.done).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressText.textContent = `${completed}/${total} 완료 (${percent}%)`;
  progressBarFill.style.width = `${percent}%`;
}

// 할 일 목록 화면 렌더링
function renderTodos() {
  todoList.innerHTML = '';

  // 현재 필터 및 검색어 조건에 맞는 할 일 선별
  const filteredTodos = todos.filter((todo) => {
    const category = todo.category || 'personal';
    const matchesCategory = currentFilter === 'all' || category === currentFilter;
    const matchesSearch = !searchKeyword || todo.text.toLowerCase().includes(searchKeyword);
    return matchesCategory && matchesSearch;
  });

  // 표시할 항목이 없을 때 빈 상태 메시지 표시
  if (filteredTodos.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'empty-message';
    emptyLi.textContent = '할 일이 없습니다. 추가해보세요!';
    todoList.appendChild(emptyLi);
    updateProgress();
    return;
  }

  filteredTodos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = 'todo-item';

    // 왼쪽 영역 (체크박스 + 카테고리 태그 + 텍스트)
    const leftDiv = document.createElement('div');
    leftDiv.className = 'todo-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    // 카테고리 색상 태그
    const category = todo.category || 'personal';
    const tag = document.createElement('span');
    tag.className = `category-tag tag-${category}`;
    tag.textContent = CATEGORIES[category] || '개인';

    // 할 일 텍스트
    const span = document.createElement('span');
    span.className = `todo-text${todo.done ? ' done' : ''}`;
    span.textContent = todo.text;
    span.title = '더블클릭하여 수정';

    // 더블클릭 시 인라인 수정 입력창으로 전환
    span.addEventListener('dblclick', () => {
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'edit-input';
      editInput.value = todo.text;

      leftDiv.replaceChild(editInput, span);
      editInput.focus();

      let isFinished = false;

      // 수정 종료 처리 (Enter로 저장, ESC 또는 blur로 취소)
      const finishEdit = (save) => {
        if (isFinished) return;
        isFinished = true;
        if (save) {
          const newText = editInput.value.trim();
          if (newText) {
            updateTodoText(todo.id, newText);
            return;
          }
        }
        renderTodos();
      };

      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          finishEdit(true);
        } else if (e.key === 'Escape') {
          finishEdit(false);
        }
      });

      editInput.addEventListener('blur', () => {
        finishEdit(false);
      });
    });

    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(tag);
    leftDiv.appendChild(span);

    // 삭제 버튼 (X)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.setAttribute('aria-label', '삭제');
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    li.appendChild(leftDiv);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });

  // 진행률 업데이트
  updateProgress();
}

// 할 일 추가
function addTodo(text, category) {
  const trimmedText = text.trim();
  if (!trimmedText) return;

  const newTodo = {
    id: Date.now(),
    text: trimmedText,
    category: category || 'personal',
    done: false
  };

  todos.push(newTodo);
  saveTodos();
  renderTodos();
}

// 할 일 텍스트 수정
function updateTodoText(id, newText) {
  todos = todos.map((todo) => {
    if (todo.id === id) {
      return { ...todo, text: newText };
    }
    return todo;
  });
  saveTodos();
  renderTodos();
}

// 완료/미완료 상태 전환
function toggleTodo(id) {
  todos = todos.map((todo) => {
    if (todo.id === id) {
      return { ...todo, done: !todo.done };
    }
    return todo;
  });
  saveTodos();
  renderTodos();
}

// 할 일 삭제
function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  renderTodos();
}

// 완료 항목 일괄 삭제
function clearCompleted() {
  const completedTodos = todos.filter((todo) => todo.done);
  if (completedTodos.length === 0) {
    alert('완료된 항목이 없습니다.');
    return;
  }

  if (confirm('완료된 항목을 모두 삭제하시겠습니까?')) {
    todos = todos.filter((todo) => !todo.done);
    saveTodos();
    renderTodos();
  }
}

// 검색창 입력 이벤트 (즉시 필터링)
searchInput.addEventListener('input', (e) => {
  searchKeyword = e.target.value.trim().toLowerCase();
  renderTodos();
});

// 필터 버튼 클릭 이벤트 등록
filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

// 폼 제출 이벤트 (Enter 키 및 추가 버튼 클릭 지원)
todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(todoInput.value, categorySelect.value);
  todoInput.value = '';
  todoInput.focus();
});

// 완료 항목 일괄 삭제 버튼 클릭 이벤트 등록
clearCompletedBtn.addEventListener('click', clearCompleted);

// 초기 화면 렌더링
renderTodos();
