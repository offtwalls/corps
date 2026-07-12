// ===== 멤버 이름 =====
const members = ["마틴", "제임스", "주훈", "성현", "건호"];

// ===== 셀 내용 =====
const labels = [
    ["", "젯틴", "훈틴", "엄틴", "껀틴"],
    ["틴젯", "", "눟젯", "셩젯", "낭젯"],
    ["틴훈", "젯쮸", "", "셩쮼", "낭쮼"],
    ["틴셩", "젯셩", "쮸엄", "", "낭셩"],
    ["틴껀", "젬껀", "쮸건", "엄껀", ""]
];

// ===== 범례 데이터 상태 관리 (수정/삭제 연동용) =====
const defaultCategories = [
    { id: "otp", name: "OTP", color: "#ffdee2" },
    { id: "good", name: "좋음", color: "#fcead2" },
    { id: "normal", name: "보통", color: "#fefcd0" },
    { id: "pass", name: "스루", color: "#e5fcdb" },
    { id: "mine", name: "지뢰", color: "#dbf4fc" }
];

// 로컬스토리지에 저장된 커스텀 범례 정보가 있으면 가져옴
let categories = JSON.parse(localStorage.getItem("cortis_categories")) || defaultCategories;

const table = document.getElementById("rpsTable");
const picker = document.getElementById("picker");
let configContainer = document.querySelector(".legend"); // HTML의 .legend 영역 선택

let selectedCell = null;

// ===== 상단 범례 편집창 및 팝업창 버튼 동적 생성 =====
function initCategories() {
    if (!configContainer) return;
    
    configContainer.innerHTML = "";
    picker.innerHTML = ""; // 기존 팝업 내부 버튼들 초기화

    // 1. 기존 범례 목록 렌더링
    categories.forEach((category) => {
        const item = document.createElement("div");
        item.className = "legend-item";
        item.style.cssText = "position: relative; display: flex; align-items: center; gap: 6px; padding-right: 12px;";

        item.innerHTML = `
            <div style="position: relative; width: 20px; height: 20px; border-radius: 50%; overflow: hidden; border: 1px solid rgba(0,0,0,.15); flex-shrink: 0;">
                <input type="color" value="${category.color}" data-id="${category.id}" class="category-color-input" 
                    style="position: absolute; top: -5px; left: -5px; width: 30px; height: 30px; border: none; padding: 0; cursor: pointer; background: transparent;">
            </div>
            <input type="text" value="${category.name}" data-id="${category.id}" class="category-name-input" 
                style="width: 50px; border: none; border-bottom: 1px solid #ccc; text-align: center; font-size: 15px; font-weight: 500; font-family: inherit; outline: none; background: transparent; color: #333;">
            <button class="category-delete-btn" data-id="${category.id}" 
                style="border: none; background: transparent; color: #aaa; cursor: pointer; font-size: 11px; padding: 0 2px; font-weight: bold; margin-left: -2px; transition: color 0.15s;">✕</button>
        `;
        configContainer.appendChild(item);

        // 2. 셀 클릭 시 뜰 팝업창(picker) 내부 선택 버튼 동적 생성
        const pickBtn = document.createElement("button");
        pickBtn.className = `pick ${category.id}`;
        pickBtn.dataset.color = category.id;
        
        // 실시간 색상 CSS 변수 주입
        document.documentElement.style.setProperty(`--${category.id}`, category.color);
        picker.appendChild(pickBtn);
    });

    // ===== [기능 추가] 이미지 3번 스타일의 범례 추가(+) 버튼 동적 생성 =====
    const addBtnItem = document.createElement("div");
    addBtnItem.className = "legend-add-item";
    addBtnItem.innerHTML = `
        <button id="addCategoryBtn" style="width: 24px; height: 24px; border: 1px dashed #aaa; border-radius: 50%; background: transparent; color: #999; cursor: pointer; font-size: 16px; display: grid; place-items: center; transition: all 0.2s; font-weight: bold;">+</button>
    `;
    configContainer.appendChild(addBtnItem);

    // 3. 팝업창에 지우기 버튼 추가
    const clearBtn = document.createElement("button");
    clearBtn.className = "pick clear";
    clearBtn.dataset.color = "";
    picker.appendChild(clearBtn);

    bindCategoryEvents(); // 범례 조작 이벤트 바인딩
    bindPickerEvents();   // 팝업 선택 이벤트 바인딩
}

// ===== 범례 커스텀 이벤트 연결 =====
function bindCategoryEvents() {
    // 실시간 색상 변경 이벤트
    document.querySelectorAll(".category-color-input").forEach(input => {
        input.addEventListener("input", (e) => {
            const id = e.target.dataset.id;
            const targetCat = categories.find(c => c.id === id);
            if (targetCat) {
                targetCat.color = e.target.value;
                localStorage.setItem("cortis_categories", JSON.stringify(categories));
                document.documentElement.style.setProperty(`--${id}`, e.target.value);
            }
        });
    });

    // 실시간 이름 수정 이벤트
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

    // 범례 삭제 기능 이벤트
    document.querySelectorAll(".category-delete-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.dataset.id;
            if (categories.length <= 1) {
                alert("최소 1개 이상의 범례는 남겨두어야 합니다.");
                return;
            }

            categories = categories.filter(c => c.id !== id);
            localStorage.setItem("cortis_categories", JSON.stringify(categories));

            // 지워진 범례 색상이 칠해져 있던 표의 칸들도 실시간 초기화
            document.querySelectorAll(".cell").forEach(cell => {
                if (cell.classList.contains(id)) {
                    cell.classList.remove(id);
                    localStorage.removeItem(cell.dataset.id);
                }
            });

            initCategories(); // 삭제 후 레이아웃 새로고침
        });

        btn.addEventListener("mouseenter", () => btn.style.color = "#ff4d4d");
        btn.addEventListener("mouseleave", () => btn.style.color = "#aaa");
    });

    // ===== [기능 추가] 범례 추가 버튼 클릭 이벤트 =====
    const addBtn = document.getElementById("addCategoryBtn");
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            const newId = `custom_${Date.now()}`; // 고유 ID 생성
            const newCategory = {
                id: newId,
                name: "새 범례",
                color: "#e0e0e0" // 기본 회색조 제공 후 사용자가 변경 가능하도록 함
            };
            
            categories.push(newCategory);
            localStorage.setItem("cortis_categories", JSON.stringify(categories));
            initCategories(); // 화면 갱신
        });

        addBtn.addEventListener("mouseenter", () => {
            addBtn.style.borderColor = "#666";
            addBtn.style.color = "#333";
            addBtn.style.background = "rgba(0,0,0,0.02)";
        });
        addBtn.addEventListener("mouseleave", () => {
            addBtn.style.borderColor = "#aaa";
            addBtn.style.color = "#999";
            addBtn.style.background = "transparent";
        });
    }
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
    loadColors();
    bindEvents();
}

// ===== 셀 클릭 & [보완] 팝업 화면 잘림 방지 위치 계산 =====
function bindEvents() {
    document.querySelectorAll(".cell").forEach(cell => {
        cell.addEventListener("click", e => {
            if (e.target.closest(".legend")) return; // 상단 영역 클릭 무시
            selectedCell = cell;

            // 일단 띄워야 크기(offsetWidth, offsetHeight)를 가져올 수 있으므로 display 우선 변경
            picker.style.display = "flex";

            const pickerWidth = picker.offsetWidth;
            const pickerHeight = picker.offsetHeight;
            
            // 뷰포트 크기 및 현재 스크롤 위치 구하기
            const pageX = e.pageX;
            const pageY = e.pageY;
            const windowWidth = window.innerWidth + window.scrollX;
            const windowHeight = window.innerHeight + window.scrollY;

            // 기본 위치는 클릭한 좌표
            let leftPosition = pageX;
            let topPosition = pageY;

            // [우측 잘림 보완] 클릭 위치 + 팝업 너비가 화면을 넘어가면 왼쪽으로 배치
            if (pageX + pickerWidth > windowWidth - 20) {
                leftPosition = pageX - pickerWidth;
                if (leftPosition < 10) leftPosition = 10; // 너무 왼쪽으로 밀리는 것 방지
            }

            // [하단 잘림 보완] 클릭 위치 + 팝업 높이가 화면을 넘어가면 위쪽으로 배치
            if (pageY + pickerHeight > windowHeight - 20) {
                topPosition = pageY - pickerHeight;
                if (topPosition < 10) topPosition = 10;
            }

            picker.style.left = `${leftPosition}px`;
            picker.style.top = `${topPosition}px`;
        });
    });
}

// ===== 색 선택 =====
function bindPickerEvents() {
    document.querySelectorAll(".pick").forEach(btn => {
        btn.replaceWith(btn.cloneNode(true)); // 중복 이벤트 등록 버그 방지
    });

    document.querySelectorAll(".pick").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!selectedCell) return;

            // 고유 변동 범례 클래스까지 모두 지울 수 있도록 현재 categories 상태 기반으로 클래스 제거
            categories.forEach(cat => selectedCell.classList.remove(cat.id));
            defaultCategories.forEach(cat => selectedCell.classList.remove(cat.id));

            const color = btn.dataset.color;

            if (color !== "") {
                selectedCell.classList.add(color);
                localStorage.setItem(selectedCell.dataset.id, color);
            } else {
                localStorage.removeItem(selectedCell.dataset.id);
            }

            picker.style.display = "none";
        });
    });
}

// ===== 저장 불러오기 =====
function loadColors() {
    document.querySelectorAll(".cell").forEach(cell => {
        const color = localStorage.getItem(cell.dataset.id);
        if (color) {
            cell.classList.add(color);
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

// ===== 초기 기동 =====
createTable();
initCategories();
