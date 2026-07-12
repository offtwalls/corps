// ===== 멤버 이름 =====
const members = ["마틴", "제임스", "주훈", "성현", "건호"];

// ===== 셀 내용 =====
const labels = [
    ["", "젯틴", "훈틴", "엄틴", "껀틴"],
    ["틴젯", "", "눟젯", "성젯", "낭젯"],
    ["틴훈", "젯쭈", "", "성쭌", "낭쭌"],
    ["틴성", "젯셩", "쭈엄", "", "낭셩"],
    ["틴껀", "젬껀", "쭈건", "엄껀", ""]
];

// ===== 범례 기본 데이터 상태 관리 =====
const defaultCategories = [
    { id: "otp", name: "OTP", color: "#ffd8df" },
    { id: "good", name: "좋음", color: "#ffe9c8" },
    { id: "normal", name: "보통", color: "#fff9cd" },
    { id: "pass", name: "스루", color: "#e4f9dc" },
    { id: "mine", name: "지뢰", color: "#d9f8ff" }
];

// 로컬스토리지에서 기존 커스텀 범례 정보 불러오기
let categories = JSON.parse(localStorage.getItem("cortis_categories")) || defaultCategories;

const table = document.getElementById("rpsTable");
const picker = document.getElementById("picker");
let configContainer = document.querySelector(".legend"); // HTML의 .legend 영역 선택

let selectedCell = null;

// ===== [신규] 상단 범례 조작 UI 및 픽커 버튼 생성 =====
function initCategories() {
    if (!configContainer) return;
    
    configContainer.innerHTML = "";
    picker.innerHTML = ""; // 기존 HTML에 고정되어 있던 버튼 초기화

    categories.forEach((category) => {
        // 1. 상단 범례 설정 UI (색상인풋, 텍스트인풋, 삭제버튼) 생성
        const item = document.createElement("div");
        item.className = "legend-item";
        item.style.cssText = "position: relative; display: flex; align-items: center; gap: 6px; padding-right: 12px;";

        item.innerHTML = `
            <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; overflow: hidden; border: 2px solid rgba(0,0,0,.08); flex-shrink: 0;">
                <input type="color" value="${category.color}" data-id="${category.id}" class="category-color-input" 
                    style="position: absolute; top: -5px; left: -5px; width: 32px; height: 32px; border: none; padding: 0; cursor: pointer; background: transparent;">
            </div>
            <input type="text" value="${category.name}" data-id="${category.id}" class="category-name-input" 
                style="width: 50px; border: none; border-bottom: 1px solid #ccc; text-align: center; font-size: 15px; font-weight: 500; font-family: inherit; outline: none; background: transparent; color: #333;">
            <button class="category-delete-btn" data-id="${category.id}" 
                style="border: none; background: transparent; color: #aaa; cursor: pointer; font-size: 11px; padding: 0 2px; font-weight: bold; margin-left: -2px; transition: color 0.15s;">✕</button>
        `;
        configContainer.appendChild(item);

        // 2. 셀 클릭 시 나타나는 팝업(picker) 내부 선택 버튼 동적 생성
        const pickBtn = document.createElement("button");
        pickBtn.className = "pick";
        pickBtn.dataset.color = category.id;
        pickBtn.style.backgroundColor = category.color; // CSS 의존 없이 실시간 배경색 부여
        picker.appendChild(pickBtn);
    });

    // 3. 범례 [추가] 버튼 만들기
    const addBtn = document.createElement("button");
    addBtn.className = "legend-item";
    addBtn.innerHTML = "+";
    addBtn.style.cssText = "width: 24px; height: 24px; border-radius: 50%; border: 1px dashed #999; background: transparent; color: #999; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; margin-left: 4px;";
    addBtn.addEventListener("click", addNewCategory);
    configContainer.appendChild(addBtn);

    // 4. 팝업창에 [지우기] 버튼 추가
    const clearBtn = document.createElement("button");
    clearBtn.className = "pick clear";
    clearBtn.dataset.color = "";
    picker.appendChild(clearBtn);

    bindCategoryEvents(); // 범례 수정/삭제 이벤트 연결
    bindPickerEvents();   // 색상 픽커 이벤트 연결
}

// ===== [신규] 새 범례 추가 함수 =====
function addNewCategory() {
    const newId = "custom_" + Date.now(); // 고유 ID 생성
    const newCat = {
        id: newId,
        name: "새 범례",
        color: "#e0e0e0"
    };
    categories.push(newCat);
    localStorage.setItem("cortis_categories", JSON.stringify(categories));
    initCategories();
}

// ===== [신규] 범례 수정, 삭제 실시간 연동 이벤트 =====
function bindCategoryEvents() {
    // 실시간 색상 변경
    document.querySelectorAll(".category-color-input").forEach(input => {
        input.addEventListener("input", (e) => {
            const id = e.target.dataset.id;
            const targetCat = categories.find(c => c.id === id);
            if (targetCat) {
                targetCat.color = e.target.value;
                localStorage.setItem("cortis_categories", JSON.stringify(categories));
                
                // 표 내부에서 해당 범례가 칠해진 셀들의 색상도 실시간 동기화
                document.querySelectorAll(".cell").forEach(cell => {
                    if (localStorage.getItem(cell.dataset.id) === id) {
                        cell.style.backgroundColor = e.target.value;
                    }
                });
                
                // 팝업창(picker) 안의 버튼 색상도 실시간 동기화
                const pickerBtn = picker.querySelector(`[data-color="${id}"]`);
                if (pickerBtn) pickerBtn.style.backgroundColor = e.target.value;
            }
        });
    });

    // 실시간 이름 수정
    document.querySelectorAll(".category-name-input").forEach(input => {
        input.addEventListener("input", (e) => {
            const id = e.target.dataset.id;
            const targetCat = categories.find(c => c.id === id);
            if (targetCat) {
                targetCat.name = e.target.value;
                localStorage.setItem("cortis_categories", JSON.stringify(categories));
            }
        });
    });

    // 범례 삭제 기능
    document.querySelectorAll(".category-delete-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.dataset.id;
            if (categories.length <= 1) {
                alert("최소 1개 이상의 범례는 유지되어야 합니다.");
                return;
            }

            categories = categories.filter(c => c.id !== id);
            localStorage.setItem("cortis_categories", JSON.stringify(categories));

            // 지워진 범례의 색상이 칠해져 있던 표 칸들은 초기화 처리
            document.querySelectorAll(".cell").forEach(cell => {
                if (localStorage.getItem(cell.dataset.id) === id) {
                    cell.style.backgroundColor = "";
                    localStorage.removeItem(cell.dataset.id);
                }
            });

            initCategories(); // 변경된 레이아웃 다시 그리기
        });

        btn.addEventListener("mouseenter", () => btn.style.color = "#ff4d4d");
        btn.addEventListener("mouseleave", () => btn.style.color = "#aaa");
    });
}

// ===== 표 생성 =====
function createTable() {
    let html = "<tr><th></th>";
    members.forEach(name => {
        html += `<th>${name}</th>`;
    });
    html += "</tr>";

    members.forEach((rowName, row) => {
        html += `<tr><th>${rowName}</th>`;
        members.forEach((_, col) => {
            if (row === col) {
                html += `<td class="disabled"></td>`;
            } else {
                html += `
                <td
                    data-id="${row}-${col}"
                    class="cell">
                    ${labels[row][col]}
                </td>`;
            }
        });
        html += "</tr>";
    });

    table.innerHTML = html;
    loadColors(); // 저장된 색상 로드
    bindEvents(); // 기본 이벤트 연결
}

// ===== 셀 클릭 =====
function bindEvents() {
    document.querySelectorAll(".cell").forEach(cell => {
        cell.addEventListener("click", e => {
            if (e.target.closest(".legend")) return;
            selectedCell = cell;
            picker.style.display = "flex";
            picker.style.left = `${e.pageX}px`;
            picker.style.top = `${e.pageY}px`;
        });
    });
}

// ===== 색 선택 (동적 이벤트 매칭용) =====
function bindPickerEvents() {
    document.querySelectorAll("#picker .pick").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!selectedCell) return;

            const colorId = btn.dataset.color;

            if (colorId !== "") {
                const cat = categories.find(c => c.id === colorId);
                if (cat) {
                    selectedCell.style.backgroundColor = cat.color; // JS 스타일 직접 주입
                    localStorage.setItem(selectedCell.dataset.id, colorId);
                }
            } else {
                // 지우기(X) 클릭 시
                selectedCell.style.backgroundColor = "";
                localStorage.removeItem(selectedCell.dataset.id);
            }

            picker.style.display = "none";
        });
    });
}

// ===== 저장 불러오기 =====
function loadColors() {
    document.querySelectorAll(".cell").forEach(cell => {
        const colorId = localStorage.getItem(cell.dataset.id);
        if (colorId) {
            // 현재 활성화되어 있는 범례 배열에서 ID가 일치하는 색상을 찾아 매칭
            const cat = categories.find(c => c.id === colorId);
            if (cat) {
                cell.style.backgroundColor = cat.color;
            }
        }
    });
}

// ===== 바깥 클릭 시 닫기 =====
window.addEventListener("click", e => {
    if (
        !picker.contains(e.target) &&
        !e.target.classList.contains("cell") &&
        !e.target.closest(".legend")
    ) {
        picker.style.display = "none";
    }
});

// ===== ESC =====
window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        picker.style.display = "none";
    }
});

// ===== 초기 실행 =====
createTable();
initCategories();
