const SUPABASE_URL = "https://ajxnszhrtymcxiiucgqe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Fv5ZHZJfEzI9nzHMM4blLA_b7EKPUlV";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


let currentUser = null;
let currentLog = null;
let logs = [];
let goals = [];
let signupMode = false;


const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const authButton = document.getElementById("authButton");
const switchAuth = document.getElementById("switchAuth");
const authMessage = document.getElementById("authMessage");

const userEmail = document.getElementById("userEmail");
const currentDate = document.getElementById("currentDate");


function getToday() {
    return new Date().toISOString().split("T")[0];
}


function formatMinutes(minutes) {
    minutes = Number(minutes) || 0;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours}h ${String(mins).padStart(2, "0")}m`;
}


function formatShortMinutes(minutes) {
    minutes = Number(minutes) || 0;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }

    return `${mins}m`;
}


function showAuthMessage(message, error = false) {
    authMessage.textContent = message;
    authMessage.style.color = error ? "#ff5d73" : "var(--cyan)";
}


function updateDate() {
    const date = new Date();

    currentDate.textContent = date.toLocaleDateString(
        "en-IN",
        {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).toUpperCase();
}


async function initialize() {

    updateDate();

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();

    if (session) {
        await startApp(session.user);
    }

    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            if (session) {
                await startApp(session.user);
            } else {
                stopApp();
            }

        }
    );
}


async function startApp(user) {

    currentUser = user;

    userEmail.textContent = user.email;

    authScreen.classList.add("hidden");
    app.classList.remove("hidden");

    await loadData();
}


function stopApp() {

    currentUser = null;

    app.classList.add("hidden");
    authScreen.classList.remove("hidden");

    emailInput.value = "";
    passwordInput.value = "";
}


authButton.addEventListener("click", async () => {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showAuthMessage("EMAIL AND PASSWORD REQUIRED", true);
        return;
    }

    authButton.disabled = true;

    if (signupMode) {

        const {
            error
        } = await supabaseClient.auth.signUp({
            email,
            password
        });

        if (error) {

            showAuthMessage(
                error.message.toUpperCase(),
                true
            );

        } else {

            showAuthMessage(
                "ACCOUNT CREATED. CHECK YOUR EMAIL."
            );

        }

    } else {

        const {
            error
        } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {

            showAuthMessage(
                error.message.toUpperCase(),
                true
            );

        }

    }

    authButton.disabled = false;

});


switchAuth.addEventListener("click", () => {

    signupMode = !signupMode;

    if (signupMode) {

        authButton.textContent = "CREATE ACCOUNT";
        switchAuth.textContent = "BACK TO LOGIN";

    } else {

        authButton.textContent = "INITIALIZE SESSION";
        switchAuth.textContent = "CREATE ACCOUNT";

    }

    authMessage.textContent = "";

});


document.getElementById("logoutButton").addEventListener(
    "click",
    async () => {
        await supabaseClient.auth.signOut();
    }
);


/* NAVIGATION */

document.querySelectorAll(".nav-item").forEach(button => {

    button.addEventListener("click", () => {

        const page = button.dataset.page;

        document.querySelectorAll(".nav-item")
            .forEach(item => item.classList.remove("active"));

        button.classList.add("active");

        document.querySelectorAll(".page")
            .forEach(item => item.classList.remove("active-page"));

        document
            .getElementById(`${page}Page`)
            .classList.add("active-page");

        document.getElementById("pageTitle")
            .textContent = page.toUpperCase();

    });

});


/* DATA */

async function loadData() {

    if (!currentUser) return;

    const [
        logsResult,
        goalsResult
    ] = await Promise.all([

        supabaseClient
            .from("daily_logs")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("log_date", {
                ascending: false
            }),

        supabaseClient
            .from("goals")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", {
                ascending: false
            })

    ]);

    if (logsResult.error) {
        console.error(logsResult.error);
        return;
    }

    if (goalsResult.error) {
        console.error(goalsResult.error);
        return;
    }

    logs = logsResult.data || [];
    goals = goalsResult.data || [];

    currentLog = logs.find(
        log => log.log_date === getToday()
    ) || null;

    fillDailyForm();
    renderDashboard();
    renderSkills();
    renderGoals();
    renderHistory();
}


/* DAILY FORM */

function fillDailyForm() {

    const log = currentLog;

    if (!log) {

        document
            .querySelectorAll("#dailyForm input, #dailyForm textarea")
            .forEach(input => {
                input.value = "";
            });

        return;
    }

    document.getElementById("focusInput").value =
        log.focus_minutes || 0;

    document.getElementById("codingInput").value =
        log.coding_minutes || 0;

    document.getElementById("ctInput").value =
        log.ct_minutes || 0;

    document.getElementById("actInput").value =
        log.act_minutes || 0;

    document.getElementById("wpmInput").value =
        log.typing_wpm || 0;

    document.getElementById("accuracyInput").value =
        log.typing_accuracy || 0;

    document.getElementById("htmlInput").value =
        log.html_lines || 0;

    document.getElementById("cssInput").value =
        log.css_lines || 0;

    document.getElementById("jsInput").value =
        log.js_lines || 0;

    document.getElementById("pythonInput").value =
        log.python_lines || 0;

    document.getElementById("completedInput").value =
        log.tasks_completed || 0;

    document.getElementById("totalInput").value =
        log.tasks_total || 0;

    document.getElementById("notesInput").value =
        log.notes || "";
}


function numberValue(id) {

    const value = Number(
        document.getElementById(id).value
    );

    return Number.isFinite(value) && value >= 0
        ? value
        : 0;
}


document.getElementById("dailyForm")
    .addEventListener("submit", async event => {

        event.preventDefault();

        if (!currentUser) return;

        const record = {

            user_id: currentUser.id,

            log_date: getToday(),

            focus_minutes: numberValue("focusInput"),
            coding_minutes: numberValue("codingInput"),
            ct_minutes: numberValue("ctInput"),
            act_minutes: numberValue("actInput"),

            typing_wpm: numberValue("wpmInput"),

            typing_accuracy: Math.min(
                100,
                numberValue("accuracyInput")
            ),

            html_lines: numberValue("htmlInput"),
            css_lines: numberValue("cssInput"),
            js_lines: numberValue("jsInput"),
            python_lines: numberValue("pythonInput"),

            tasks_completed: numberValue("completedInput"),
            tasks_total: numberValue("totalInput"),

            notes: document.getElementById("notesInput").value.trim()

        };

        const {
            error
        } = await supabaseClient
            .from("daily_logs")
            .upsert(
                record,
                {
                    onConflict: "user_id,log_date"
                }
            );

        if (error) {

            alert(error.message);
            return;

        }

        await loadData();

        alert("DAILY RECORD SAVED");

    });


/* DASHBOARD */

function renderDashboard() {

    const log = currentLog || {

        focus_minutes: 0,
        coding_minutes: 0,
        typing_wpm: 0,
        typing_accuracy: 0,
        tasks_completed: 0,
        tasks_total: 0

    };


    document.getElementById("focusValue")
        .textContent = formatMinutes(log.focus_minutes);

    document.getElementById("codingValue")
        .textContent = formatMinutes(log.coding_minutes);

    document.getElementById("typingValue")
        .textContent = `${log.typing_wpm || 0} WPM`;

    document.getElementById("accuracyValue")
        .textContent =
        `${log.typing_accuracy || 0}% ACCURACY`;

    document.getElementById("tasksValue")
        .textContent =
        `${log.tasks_completed || 0} / ${log.tasks_total || 0}`;


    const taskPercent =
        log.tasks_total > 0
            ? Math.round(
                (log.tasks_completed / log.tasks_total) * 100
            )
            : 0;

    document.getElementById("taskPercent")
        .textContent = `${taskPercent}% COMPLETE`;


    document.getElementById("todayHours")
        .textContent =
        `${Math.floor((log.focus_minutes || 0) / 60)}h`;


    document.getElementById("streakValue")
        .textContent = calculateStreak();


    renderChart();
    renderRecent();

}


function getLastSevenDays() {

    const result = [];

    const today = new Date();

    for (let i = 6; i >= 0; i--) {

        const date = new Date(today);

        date.setDate(today.getDate() - i);

        const iso =
            date.toISOString().split("T")[0];

        const log =
            logs.find(item => item.log_date === iso);

        result.push({

            date: iso,

            log: log || {
                focus_minutes: 0
            }

        });

    }

    return result;
}


function renderChart() {

    const chart =
        document.getElementById("activityChart");

    chart.innerHTML = "";

    const days = getLastSevenDays();

    const max =
        Math.max(
            ...days.map(day =>
                Number(day.log.focus_minutes) || 0
            ),
            60
        );


    days.forEach(day => {

        const column =
            document.createElement("div");

        column.className = "chart-column";

        const bar =
            document.createElement("div");

        bar.className = "chart-bar";

        const value =
            Number(day.log.focus_minutes) || 0;

        bar.style.height =
            `${Math.max(2, (value / max) * 100)}%`;

        const label =
            document.createElement("span");

        label.className = "chart-day";

        const date =
            new Date(`${day.date}T00:00:00`);

        label.textContent =
            date.toLocaleDateString(
                "en-IN",
                {
                    weekday: "short"
                }
            ).slice(0, 2)
            .toUpperCase();

        column.appendChild(bar);
        column.appendChild(label);

        chart.appendChild(column);

    });

}


function renderRecent() {

    const container =
        document.getElementById("recentActivity");

    container.innerHTML = "";

    const recent = logs.slice(0, 5);

    if (!recent.length) {

        container.innerHTML =
            `<div class="recent-row">
                <span>---</span>
                <span>NO ACTIVITY YET</span>
                <span>---</span>
            </div>`;

        return;
    }


    recent.forEach(log => {

        const row =
            document.createElement("div");

        row.className = "recent-row";

        row.innerHTML = `
            <span>${log.log_date}</span>
            <span>${formatMinutes(log.focus_minutes)} focus</span>
            <span>${log.typing_wpm || 0} WPM</span>
        `;

        container.appendChild(row);

    });

}


/* STREAK */

function calculateStreak() {

    if (!logs.length) return 0;

    const dates =
        new Set(logs.map(log => log.log_date));

    let streak = 0;

    const current = new Date();

    while (true) {

        const iso =
            current.toISOString().split("T")[0];

        if (!dates.has(iso)) {
            break;
        }

        streak++;

        current.setDate(
            current.getDate() - 1
        );

    }

    return streak;
}


/* SKILLS */

function renderSkills() {

    const totals = {

        html: 0,
        css: 0,
        js: 0,
        python: 0

    };


    logs.forEach(log => {

        totals.html += Number(log.html_lines) || 0;
        totals.css += Number(log.css_lines) || 0;
        totals.js += Number(log.js_lines) || 0;
        totals.python += Number(log.python_lines) || 0;

    });


    document.getElementById("htmlTotal")
        .textContent = `${totals.html} LOC`;

    document.getElementById("cssTotal")
        .textContent = `${totals.css} LOC`;

    document.getElementById("jsTotal")
        .textContent = `${totals.js} LOC`;

    document.getElementById("pythonTotal")
        .textContent = `${totals.python} LOC`;


    const max = Math.max(
        totals.html,
        totals.css,
        totals.js,
        totals.python,
        1
    );


    document.getElementById("htmlBar")
        .style.width =
        `${(totals.html / max) * 100}%`;

    document.getElementById("cssBar")
        .style.width =
        `${(totals.css / max) * 100}%`;

    document.getElementById("jsBar")
        .style.width =
        `${(totals.js / max) * 100}%`;

    document.getElementById("pythonBar")
        .style.width =
        `${(totals.python / max) * 100}%`;

}


/* GOALS */

document.getElementById("goalForm")
    .addEventListener("submit", async event => {

        event.preventDefault();

        if (!currentUser) return;

        const title =
            document.getElementById("goalTitle").value.trim();

        const category =
            document.getElementById("goalCategory").value.trim();

        const target =
            Number(
                document.getElementById("goalTarget").value
            );

        const unit =
            document.getElementById("goalUnit").value.trim();


        if (!title || !target || target <= 0) {
            return;
        }


        const {
            error
        } = await supabaseClient
            .from("goals")
            .insert({

                user_id: currentUser.id,

                title,

                category:
                    category || "General",

                target_value:
                    target,

                current_value:
                    0,

                unit:
                    unit || "units"

            });


        if (error) {

            alert(error.message);
            return;

        }


        event.target.reset();

        document.getElementById("goalCategory")
            .value = "General";

        document.getElementById("goalUnit")
            .value = "hours";

        await loadData();

    });


function renderGoals() {

    const container =
        document.getElementById("goalsList");

    container.innerHTML = "";


    if (!goals.length) {

        container.innerHTML = `
            <div class="panel goal">
                <span class="goal-category">
                    NO GOALS CREATED
                </span>
            </div>
        `;

        return;

    }


    goals.forEach(goal => {

        const percent =
            Math.min(
                100,
                (Number(goal.current_value) /
                    Number(goal.target_value)) * 100
            );


        const element =
            document.createElement("div");

        element.className = "goal";

        element.innerHTML = `

            <div class="goal-top">

                <div>

                    <div class="goal-name">
                        ${escapeHTML(goal.title)}
                    </div>

                    <div class="goal-category">
                        ${escapeHTML(goal.category)}
                    </div>

                </div>

                <button
                    class="delete-goal"
                    data-id="${goal.id}"
                    style="
                        background:none;
                        border:0;
                        color:#819092;
                        font-family:Space Mono;
                        font-size:10px;
                    "
                >
                    DELETE
                </button>

            </div>


            <div class="goal-progress">

                <div style="width:${percent}%"></div>

            </div>


            <div class="goal-bottom">

                <span>
                    ${goal.current_value} /
                    ${goal.target_value}
                    ${escapeHTML(goal.unit)}
                </span>

                <span>
                    ${Math.round(percent)}%
                </span>

            </div>

        `;

        container.appendChild(element);

    });


    document.querySelectorAll(".delete-goal")
        .forEach(button => {

            button.addEventListener("click", async () => {

                await supabaseClient
                    .from("goals")
                    .delete()
                    .eq("id", button.dataset.id)
                    .eq("user_id", currentUser.id);

                await loadData();

            });

        });

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* HISTORY */

function renderHistory() {

    const container =
        document.getElementById("historyList");

    container.innerHTML = "";


    logs.forEach(log => {

        const row =
            document.createElement("div");

        row.className = "history-row";

        const tasks =
            `${log.tasks_completed || 0}/${log.tasks_total || 0}`;

        row.innerHTML = `

            <span>${log.log_date}</span>

            <span>
                ${formatShortMinutes(log.focus_minutes)}
            </span>

            <span>
                ${formatShortMinutes(log.coding_minutes)}
            </span>

            <span>
                ${log.typing_wpm || 0}
            </span>

            <span>
                ${tasks}
            </span>

        `;

        container.appendChild(row);

    });

}


/* QUICK ENTRY */

const quickModal =
    document.getElementById("quickModal");


document.getElementById("quickEntryButton")
    .addEventListener(
        "click",
        () => quickModal.classList.remove("hidden")
    );


document.getElementById("closeModal")
    .addEventListener(
        "click",
        () => quickModal.classList.add("hidden")
    );


document.getElementById("quickForm")
    .addEventListener("submit", async event => {

        event.preventDefault();

        if (!currentUser) return;


        const existing =
            currentLog || {};


        const record = {

            user_id: currentUser.id,

            log_date: getToday(),

            focus_minutes:
                numberValueFromElement("quickFocus"),

            coding_minutes:
                numberValueFromElement("quickCoding"),

            typing_wpm:
                numberValueFromElement("quickWpm"),

            typing_accuracy:
                Math.min(
                    100,
                    numberValueFromElement("quickAccuracy")
                ),

            ct_minutes:
                existing.ct_minutes || 0,

            act_minutes:
                existing.act_minutes || 0,

            html_lines:
                existing.html_lines || 0,

            css_lines:
                existing.css_lines || 0,

            js_lines:
                existing.js_lines || 0,

            python_lines:
                existing.python_lines || 0,

            tasks_completed:
                existing.tasks_completed || 0,

            tasks_total:
                existing.tasks_total || 0,

            notes:
                existing.notes || ""

        };


        const {
            error
        } = await supabaseClient
            .from("daily_logs")
            .upsert(
                record,
                {
                    onConflict: "user_id,log_date"
                }
            );


        if (error) {

            alert(error.message);
            return;

        }


        quickModal.classList.add("hidden");

        event.target.reset();

        await loadData();

    });


function numberValueFromElement(id) {

    const value =
        Number(document.getElementById(id).value);

    return Number.isFinite(value) && value >= 0
        ? value
        : 0;
}


initialize();