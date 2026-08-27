/* =========================================
   LUMINA
   World News API
========================================= */

let CONFIG = {};

let newsData = [];

let currentPage = 1;

let currentCategory = "";

let currentSearch = "";

let isLoading = false;


/* =========================================
   DEFAULT CONFIG
========================================= */

const DEFAULT_CONFIG = {

    baseUrl:
        "https://api.worldnewsapi.com",

    resultsPerPage:
        12,

    defaultCountry:
        "id",

    defaultLanguage:
        "id",

    daysBack:
        7

};


/* =========================================
   ELEMENT
========================================= */

const $ = id =>
    document.getElementById(id);


/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        updateDate();

        setupTheme();

        setupMobileMenu();

        setupSearch();

        setupCategories();

        setupFilters();

        setupModal();

        await loadConfig();

    }
);


/* =========================================
   LOAD CONFIG
========================================= */

async function loadConfig() {

    try {

        const response =
            await fetch(
                "config.json",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "File config.json tidak ditemukan."
            );
        }


        const data =
            await response.json();


        CONFIG = {
            ...DEFAULT_CONFIG,
            ...data
        };


        if (
            !CONFIG.apiKey ||
            CONFIG.apiKey ===
            "YOUR_API_KEY_HERE"
        ) {

            showError(
                "API Key belum diisi. Buka config.json lalu masukkan API key World News API kamu."
            );

            return;
        }


        loadNews();

    } catch (error) {

        console.error(
            "CONFIG ERROR:",
            error
        );


        showError(
            error.message
        );

    }

}


/* =========================================
   BUILD URL
========================================= */

function buildURL() {

    const params =
        new URLSearchParams();


    /*
       World News API membutuhkan
       minimal satu parameter pencarian.
    */

    if (currentSearch) {

        params.set(
            "text",
            currentSearch
        );

    } else {

        /*
           Ambil berita 7 hari terakhir.
        */

        const latest =
            new Date();

        const earliest =
            new Date(
                latest.getTime()
                -
                (
                    CONFIG.daysBack *
                    24 *
                    60 *
                    60 *
                    1000
                )
            );


        params.set(
            "earliest-publish-date",
            formatApiDate(
                earliest
            )
        );


        params.set(
            "latest-publish-date",
            formatApiDate(
                latest
            )
        );

    }


    /* COUNTRY */

    const country =
        $("countryFilter")?.value
        ??
        CONFIG.defaultCountry;


    if (country) {

        params.set(
            "source-country",
            country
        );

    }


    /* LANGUAGE */

    const language =
        $("languageFilter")?.value
        ??
        CONFIG.defaultLanguage;


    if (language) {

        params.set(
            "language",
            language
        );

    }


    /* CATEGORY */

    if (currentCategory) {

        params.set(
            "categories",
            currentCategory
        );

    }


    /* SORT */

    params.set(
        "sort",
        "publish-time"
    );


    params.set(
        "sort-direction",
        $("sortFilter")?.value ||
        "DESC"
    );


    /* PAGINATION */

    params.set(
        "offset",
        (
            currentPage - 1
        ) *
        CONFIG.resultsPerPage
    );


    params.set(
        "number",
        CONFIG.resultsPerPage
    );


    return (
        CONFIG.baseUrl +
        "/search-news?" +
        params.toString()
    );

}


/* =========================================
   LOAD NEWS
========================================= */

async function loadNews() {

    if (isLoading) return;

    isLoading = true;


    showLoading();


    hide(
        "errorState"
    );

    hide(
        "emptyState"
    );


    try {

        const url =
            buildURL();


        console.log(
            "LUMINA API REQUEST:",
            url
        );


        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        "x-api-key":
                            CONFIG.apiKey,

                        "Accept":
                            "application/json"
                    },

                    cache:
                        "no-store"
                }
            );


        console.log(
            "API STATUS:",
            response.status
        );


        /*
           Simpan quota jika API
           mengirimkannya.
        */

        console.log(
            "Quota:",
            {
                request:
                    response.headers.get(
                        "X-API-Quota-Request"
                    ),

                used:
                    response.headers.get(
                        "X-API-Quota-Used"
                    ),

                left:
                    response.headers.get(
                        "X-API-Quota-Left"
                    )
            }
        );


        if (!response.ok) {

            let errorMessage =
                `HTTP ${response.status}`;


            try {

                const errorData =
                    await response.json();


                errorMessage =
                    errorData.message ||
                    errorData.error ||
                    JSON.stringify(
                        errorData
                    );

            } catch {

                const text =
                    await response.text();

                if (text) {
                    errorMessage =
                        text;
                }

            }


            throw new Error(
                `World News API: ${errorMessage}`
            );
        }


        const data =
            await response.json();


        console.log(
            "API DATA:",
            data
        );


        newsData =
            Array.isArray(data.news)
                ? data.news
                : [];


        if (
            newsData.length === 0
        ) {

            showEmpty();

            updateStatus(
                "Tidak ada berita yang ditemukan."
            );

            return;
        }


        renderFeatured();

        renderNews();

        renderPagination(
            Number(
                data.available ||
                newsData.length
            )
        );


        updateStatus(
            `${data.available || newsData.length} berita tersedia`
        );


    } catch (error) {

        console.error(
            "NEWS ERROR:",
            error
        );


        showError(
            createReadableError(
                error
            )
        );

    } finally {

        isLoading = false;

    }

}


/* =========================================
   LOADING
========================================= */

function showLoading() {

    const featured =
        $("featuredNews");

    const grid =
        $("newsGrid");


    if (featured) {

        featured.innerHTML = `
            <div class="loading-box"></div>
            <div class="loading-box"></div>
            <div class="loading-box"></div>
        `;

    }


    if (grid) {

        grid.innerHTML =
            Array.from(
                {
                    length: 6
                },
                () => `
                    <div class="news-card">
                        <div
                            class="loading-box"
                            style="height:220px"
                        ></div>

                        <div
                            style="padding:22px"
                        >
                            <div
                                class="loading-box"
                                style="height:15px"
                            ></div>

                            <br>

                            <div
                                class="loading-box"
                                style="height:55px"
                            ></div>
                        </div>
                    </div>
                `
            ).join("");

    }

}


/* =========================================
   FEATURED
========================================= */

function renderFeatured() {

    const container =
        $("featuredNews");


    if (!container) return;


    const featured =
        newsData.slice(
            0,
            3
        );


    container.innerHTML =
        featured
            .map(
                (
                    article,
                    index
                ) => {

                    return `

                        <article
                            class="featured-card"
                            data-index="${index}"
                        >

                            <img
                                src="${safeImage(
                                    article.image
                                )}"
                                alt="${escapeHTML(
                                    article.title
                                )}"
                                loading="eager"
                                onerror="this.style.display='none'"
                            >

                            <div
                                class="featured-overlay"
                            >

                                <span
                                    class="featured-category"
                                >
                                    ${escapeHTML(
                                        article.category ||
                                        "NEWS"
                                    )}
                                </span>


                                <h2
                                    class="featured-title"
                                >
                                    ${escapeHTML(
                                        article.title
                                    )}
                                </h2>


                                <div
                                    class="featured-meta"
                                >

                                    <span>
                                        ${formatDate(
                                            article.publish_date
                                        )}
                                    </span>

                                    <span>
                                        ${getCountryName(
                                            article.source_country
                                        )}
                                    </span>

                                </div>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            ".featured-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        openArticle(
                            Number(
                                card.dataset.index
                            )
                        );

                    }
                );

            }
        );

}


/* =========================================
   NEWS GRID
========================================= */

function renderNews() {

    const grid =
        $("newsGrid");


    if (!grid) return;


    /*
       Semua berita tetap ditampilkan
       di grid.
    */

    grid.innerHTML =
        newsData
            .map(
                (
                    article,
                    index
                ) => {

                    const summary =
                        article.summary ||
                        article.text ||
                        "Tidak ada ringkasan.";


                    return `

                        <article
                            class="news-card"
                            data-index="${index}"
                        >

                            <div
                                class="news-image"
                            >

                                <img
                                    src="${safeImage(
                                        article.image
                                    )}"
                                    alt="${escapeHTML(
                                        article.title
                                    )}"
                                    loading="lazy"
                                    onerror="this.style.display='none'"
                                >

                            </div>


                            <div
                                class="news-content"
                            >

                                <div
                                    class="article-meta"
                                >

                                    <span>
                                        ${escapeHTML(
                                            article.category ||
                                            "NEWS"
                                        )}
                                    </span>

                                    <span>
                                        ${formatDate(
                                            article.publish_date
                                        )}
                                    </span>

                                </div>


                                <h3
                                    class="news-title"
                                >
                                    ${escapeHTML(
                                        article.title
                                    )}
                                </h3>


                                <p
                                    class="news-summary"
                                >
                                    ${escapeHTML(
                                        summary
                                    )}
                                </p>


                                <div
                                    class="news-footer"
                                >

                                    <span
                                        class="news-source"
                                    >
                                        ${getCountryName(
                                            article.source_country
                                        )}
                                    </span>

                                    <span
                                        class="read-more"
                                    >
                                        Baca →
                                    </span>

                                </div>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");


    grid
        .querySelectorAll(
            ".news-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        openArticle(
                            Number(
                                card.dataset.index
                            )
                        );

                    }
                );

            }
        );

}


/* =========================================
   OPEN ARTICLE
========================================= */

function openArticle(index) {

    const article =
        newsData[index];


    if (!article) return;


    $("modalImage").src =
        safeImage(
            article.image
        );


    $("modalImage").alt =
        article.title ||
        "News";


    $("modalMeta").innerHTML = `

        <span>
            ${escapeHTML(
                article.category ||
                "NEWS"
            )}
        </span>

        <span>
            ${formatDate(
                article.publish_date
            )}
        </span>

        <span>
            ${getCountryName(
                article.source_country
            )}
        </span>

    `;


    $("modalTitle").textContent =
        article.title ||
        "Tanpa judul";


    $("modalSummary").textContent =
        article.summary ||
        article.text ||
        "Tidak ada ringkasan.";


    $("modalLink").href =
        article.url ||
        "#";


    $("articleModal")
        .classList.remove(
            "hidden"
        );


    document.body.style.overflow =
        "hidden";

}


/* =========================================
   MODAL
========================================= */

function setupModal() {

    $("closeModal")
        ?.addEventListener(
            "click",
            closeModal
        );


    $("modalBackdrop")
        ?.addEventListener(
            "click",
            closeModal
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeModal();

            }

        }
    );

}


function closeModal() {

    $("articleModal")
        ?.classList.add(
            "hidden"
        );


    document.body.style.overflow =
        "";

}


/* =========================================
   SEARCH
========================================= */

function setupSearch() {

    $("searchForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const value =
                    $("searchInput")
                        .value
                        .trim();


                if (
                    value &&
                    value.length < 3
                ) {

                    showError(
                        "Pencarian minimal 3 karakter."
                    );

                    return;

                }


                currentSearch =
                    value;


                currentPage =
                    1;


                loadNews();

            }
        );

}


/* =========================================
   CATEGORY
========================================= */

function setupCategories() {

    document
        .querySelectorAll(
            ".category-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".category-button"
                            )
                            .forEach(
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );


                        button.classList.add(
                            "active"
                        );


                        currentCategory =
                            button.dataset.category ||
                            "";


                        currentPage =
                            1;


                        loadNews();

                    }
                );

            }
        );

}


/* =========================================
   FILTER
========================================= */

function setupFilters() {

    $("filterButton")
        ?.addEventListener(
            "click",
            () => {

                $("filterPanel")
                    .classList.toggle(
                        "open"
                    );

            }
        );


    [
        "countryFilter",
        "languageFilter",
        "sortFilter"
    ]
        .forEach(
            id => {

                $(id)
                    ?.addEventListener(
                        "change",
                        () => {

                            currentPage =
                                1;

                            loadNews();

                        }
                    );

            }
        );


    $("resetButton")
        ?.addEventListener(
            "click",
            () => {

                $("countryFilter").value =
                    CONFIG.defaultCountry;


                $("languageFilter").value =
                    CONFIG.defaultLanguage;


                $("sortFilter").value =
                    "DESC";


                $("searchInput").value =
                    "";


                currentSearch =
                    "";


                currentCategory =
                    "";


                currentPage =
                    1;


                document
                    .querySelectorAll(
                        ".category-button"
                    )
                    .forEach(
                        button =>
                            button.classList.remove(
                                "active"
                            )
                    );


                document
                    .querySelector(
                        '.category-button[data-category=""]'
                    )
                    ?.classList.add(
                        "active"
                    );


                loadNews();

            }
        );

}


/* =========================================
   PAGINATION
========================================= */

function renderPagination(total) {

    const pagination =
        $("pagination");


    if (!pagination) return;


    const totalPages =
        Math.ceil(
            total /
            CONFIG.resultsPerPage
        );


    if (
        totalPages <= 1
    ) {

        pagination.innerHTML =
            "";

        return;

    }


    let html = "";


    html += `
        <button
            class="page-button"
            ${currentPage === 1 ? "disabled" : ""}
            data-page="${currentPage - 1}"
        >
            ‹
        </button>
    `;


    const start =
        Math.max(
            1,
            currentPage - 2
        );


    const end =
        Math.min(
            totalPages,
            currentPage + 2
        );


    for (
        let i = start;
        i <= end;
        i++
    ) {

        html += `

            <button
                class="page-button ${
                    i === currentPage
                        ? "active"
                        : ""
                }"
                data-page="${i}"
            >
                ${i}
            </button>

        `;

    }


    html += `
        <button
            class="page-button"
            ${currentPage === totalPages ? "disabled" : ""}
            data-page="${currentPage + 1}"
        >
            ›
        </button>
    `;


    pagination.innerHTML =
        html;


    pagination
        .querySelectorAll(
            ".page-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const page =
                            Number(
                                button.dataset.page
                            );


                        if (
                            !page ||
                            page < 1 ||
                            page > totalPages
                        ) return;


                        currentPage =
                            page;


                        loadNews();


                        $("latest")
                            ?.scrollIntoView({
                                behavior:
                                    "smooth"
                            });

                    }
                );

            }
        );

}


/* =========================================
   THEME
========================================= */

function setupTheme() {

    const saved =
        localStorage.getItem(
            "lumina-theme"
        );


    if (
        saved ===
        "dark"
    ) {

        document.body.classList.add(
            "dark"
        );

        $("themeButton").textContent =
            "☀";

    }


    $("themeButton")
        ?.addEventListener(
            "click",
            () => {

                const dark =
                    document.body
                        .classList
                        .toggle(
                            "dark"
                        );


                $("themeButton")
                    .textContent =
                    dark
                        ? "☀"
                        : "☾";


                localStorage.setItem(
                    "lumina-theme",
                    dark
                        ? "dark"
                        : "light"
                );

            }
        );

}


/* =========================================
   MOBILE MENU
========================================= */

function setupMobileMenu() {

    $("mobileMenuButton")
        ?.addEventListener(
            "click",
            () => {

                $("mobileNav")
                    .classList
                    .toggle(
                        "open"
                    );

            }
        );


    document
        .querySelectorAll(
            "#mobileNav a"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        $("mobileNav")
                            .classList
                            .remove(
                                "open"
                            );

                    }
                );

            }
        );

}


/* =========================================
   DATE
========================================= */

function updateDate() {

    const element =
        $("todayDate");


    if (!element) return;


    element.textContent =
        new Date()
            .toLocaleDateString(
                "id-ID",
                {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );

}


/* =========================================
   STATUS
========================================= */

function updateStatus(text) {

    const status =
        $("resultStatus");


    if (status) {

        status.textContent =
            text;

    }

}


/* =========================================
   ERROR
========================================= */

function showError(message) {

    const error =
        $("errorState");


    const text =
        $("errorText");


    if (error) {

        error.classList.remove(
            "hidden"
        );

    }


    if (text) {

        text.textContent =
            message;

    }


    $("newsGrid").innerHTML =
        "";


    $("featuredNews").innerHTML =
        "";


    hide(
        "emptyState"
    );


    updateStatus(
        "Terjadi kesalahan."
    );

}


function createReadableError(error) {

    const message =
        error?.message ||
        "Terjadi kesalahan tidak dikenal.";


    if (
        message.includes(
            "401"
        )
    ) {

        return (
            "API Key tidak valid atau belum diisi. " +
            "Periksa config.json."
        );

    }


    if (
        message.includes(
            "403"
        )
    ) {

        return (
            "Akses API ditolak. " +
            "Periksa akun atau izin API."
        );

    }


    if (
        message.includes(
            "429"
        )
    ) {

        return (
            "Quota API sudah mencapai batas. " +
            "Coba lagi nanti."
        );

    }


    if (
        message.includes(
            "Failed to fetch"
        )
    ) {

        return (
            "Browser gagal terhubung ke World News API. " +
            "Pastikan website dijalankan menggunakan Live Server."
        );

    }


    return message;

}


/* =========================================
   EMPTY
========================================= */

function showEmpty() {

    $("newsGrid").innerHTML =
        "";


    $("featuredNews").innerHTML =
        "";


    $("emptyState")
        .classList
        .remove(
            "hidden"
        );

}


/* =========================================
   HELPERS
========================================= */

function hide(id) {

    $(id)
        ?.classList
        .add(
            "hidden"
        );

}


function formatApiDate(date) {

    return date
        .toISOString()
        .slice(
            0,
            19
        )
        .replace(
            "T",
            " "
        );

}


function formatDate(value) {

    if (!value)
        return "-";


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function safeImage(url) {

    if (
        typeof url ===
        "string" &&
        url.startsWith(
            "http"
        )
    ) {

        return url;

    }


    return (
        "https://placehold.co/1200x800/" +
        "222222/ffffff?text=LUMINA"
    );

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function getCountryName(code) {

    const countries = {

        id:
            "Indonesia",

        us:
            "Amerika Serikat",

        gb:
            "Inggris",

        au:
            "Australia",

        jp:
            "Jepang",

        sg:
            "Singapura",

        my:
            "Malaysia",

        de:
            "Jerman",

        fr:
            "Prancis"

    };


    return (
        countries[
            code
        ] ||
        code ||
        "Global"
    );

}