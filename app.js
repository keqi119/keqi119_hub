const models = [
  {
    id: "model-e",
    name: "Model E 城市版",
    type: ["ev", "sedan", "available"],
    price: "¥4,280/月",
    deposit: "¥12,000",
    range: "520 km",
    stock: "上海 12 台",
    status: "现车可订",
    paint: "#106bff",
    tags: ["纯电", "轿车", "1 天交付"],
    intro: "适合城市通勤和家庭日常出行，续航充足，配置均衡。"
  },
  {
    id: "voyage-suv",
    name: "Voyage SUV Pro",
    type: ["ev", "suv", "available"],
    price: "¥5,680/月",
    deposit: "¥18,000",
    range: "610 km",
    stock: "杭州 6 台",
    status: "现车可订",
    paint: "#00a884",
    tags: ["纯电", "SUV", "大空间"],
    intro: "更高通过性和装载能力，适合家庭长途、露营和商务接待。"
  },
  {
    id: "lux-s",
    name: "Lux S 商务版",
    type: ["sedan"],
    price: "¥7,980/月",
    deposit: "¥28,000",
    range: "燃油/混动",
    stock: "北京 3 台",
    status: "需审核排期",
    paint: "#172033",
    tags: ["商务", "轿车", "司机服务可选"],
    intro: "面向商务接待与企业管理层用车，支持企业月结和专属交付。"
  },
  {
    id: "mini-go",
    name: "Mini Go 灵活版",
    type: ["ev", "available"],
    price: "¥2,680/月",
    deposit: "¥8,000",
    range: "360 km",
    stock: "广州 18 台",
    status: "现车可订",
    paint: "#f59f00",
    tags: ["纯电", "短租优选", "低押金"],
    intro: "低成本灵活用车方案，适合个人短期通勤与门店员工代步。"
  }
];

const plans = [
  {
    name: "12 个月灵活订阅",
    price: "¥4,980/月",
    badge: "灵活",
    perks: ["每月 1,500 公里", "基础保险", "免费保养", "提前退订手续费 1 个月"]
  },
  {
    name: "24 个月标准订阅",
    price: "¥4,280/月",
    badge: "推荐",
    featured: true,
    perks: ["每月 2,000 公里", "基础保险 + 玻璃险", "免费保养", "可免费换车 1 次"]
  },
  {
    name: "36 个月长期订阅",
    price: "¥3,880/月",
    badge: "省心",
    perks: ["每月 2,500 公里", "全险服务包", "上门取送保养", "企业月结支持"]
  }
];

const adminModules = {
  vehicles: {
    title: "车辆管理",
    kpis: [
      ["车型数量", "18"],
      ["车架号库存", "126"],
      ["可订车辆", "84"]
    ],
    columns: ["车型", "车架号", "库存城市", "状态"],
    rows: [
      ["Model E 城市版", "LSE20260521001", "上海", "可订"],
      ["Voyage SUV Pro", "LSV20260521018", "杭州", "待交付"],
      ["Mini Go 灵活版", "LSM20260521032", "广州", "保养中"]
    ]
  },
  pricing: {
    title: "价格管理",
    kpis: [
      ["价格方案", "32"],
      ["平均月租", "¥4,860"],
      ["优惠活动", "6"]
    ],
    columns: ["方案", "月租", "押金", "周期", "优惠"],
    rows: [
      ["24 个月标准订阅", "¥4,280", "¥12,000", "24 月", "首月 8 折"],
      ["36 个月长期订阅", "¥3,880", "¥12,000", "36 月", "免交付费"],
      ["企业车队方案", "¥4,050", "¥10,000", "24 月", "5 台起优惠"]
    ]
  },
  orders: {
    title: "订单管理",
    kpis: [
      ["申请中", "28"],
      ["待签约", "11"],
      ["退订处理", "5"]
    ],
    columns: ["订单号", "客户", "车型", "阶段", "负责人"],
    rows: [
      ["SO20260521001", "陈女士", "Model E", "待签约", "Linda"],
      ["SO20260520019", "星辉科技", "Voyage SUV", "审核中", "Kevin"],
      ["SO20260518007", "周先生", "Mini Go", "交付中", "Mia"]
    ]
  },
  customers: {
    title: "客户管理",
    kpis: [
      ["实名客户", "2,486"],
      ["驾驶证待审", "17"],
      ["企业客户", "132"]
    ],
    columns: ["客户", "身份信息", "驾驶证", "风控资料"],
    rows: [
      ["陈女士", "已认证", "有效", "通过"],
      ["星辉科技", "企业认证", "多人授权", "复审中"],
      ["周先生", "已认证", "即将过期", "补充材料"]
    ]
  },
  contracts: {
    title: "合同管理",
    kpis: [
      ["合同模板", "9"],
      ["待电子签", "14"],
      ["本月下载", "326"]
    ],
    columns: ["合同编号", "模板", "电子签", "下载"],
    rows: [
      ["CT20260521001", "个人标准版", "待签署", "可下载"],
      ["CT20260520011", "企业车队版", "已签署", "可下载"],
      ["CT20260519008", "退订协议", "待签署", "生成中"]
    ]
  },
  payments: {
    title: "支付管理",
    kpis: [
      ["押金余额", "¥9,842,000"],
      ["本月月租", "¥1,260,000"],
      ["逾期账单", "19"]
    ],
    columns: ["流水号", "类型", "金额", "状态", "备注"],
    rows: [
      ["PAY20260521001", "押金", "¥12,000", "已支付", "微信"],
      ["PAY20260520045", "月租", "¥4,280", "待支付", "自动提醒"],
      ["RF20260519003", "退款", "¥8,000", "处理中", "退订结算"]
    ]
  },
  risk: {
    title: "风控审核",
    kpis: [
      ["人工审核", "23"],
      ["黑名单命中", "2"],
      ["资料校验率", "98.2%"]
    ],
    columns: ["客户", "审核项", "风险等级", "处理状态"],
    rows: [
      ["陈女士", "驾驶证 OCR", "低", "通过"],
      ["王先生", "黑名单比对", "高", "拒绝"],
      ["星辉科技", "企业授权书", "中", "人工复审"]
    ]
  },
  analytics: {
    title: "运营数据",
    kpis: [
      ["转化率", "18.6%"],
      ["库存周转", "42 天"],
      ["逾期率", "1.9%"]
    ],
    columns: ["指标", "本周", "上周", "变化"],
    rows: [
      ["访问到申请转化率", "18.6%", "16.8%", "+1.8%"],
      ["库存平均周转", "42 天", "46 天", "-4 天"],
      ["账单逾期率", "1.9%", "2.4%", "-0.5%"]
    ]
  }
};

const pages = [...document.querySelectorAll(".page")];
const navLinks = [...document.querySelectorAll("[data-route]")];
const modelGrid = document.querySelector("#modelGrid");
const detailView = document.querySelector("#detailView");
const planGrid = document.querySelector("#planGrid");

function routeTo(route) {
  const fallback = document.querySelector(`[data-page="${route}"]`) ? route : "home";
  pages.forEach((page) => page.classList.toggle("active", page.dataset.page === fallback));
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.route === fallback));
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderModels(filter = "all") {
  const visible = models.filter((model) => filter === "all" || model.type.includes(filter));
  modelGrid.innerHTML = visible
    .map(
      (model) => `
        <article class="model-card">
          <div class="model-image">
            <div class="mini-car" style="--paint:${model.paint}"></div>
          </div>
          <div>
            <div class="tag-row">${model.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
            <h3>${model.name}</h3>
            <p>${model.intro}</p>
          </div>
          <div class="card-foot">
            <div>
              <strong class="price">${model.price}</strong>
              <p>押金 ${model.deposit}</p>
            </div>
            <a class="secondary-button" href="#detail" data-model="${model.id}">详情</a>
          </div>
        </article>
      `
    )
    .join("");
}

function renderDetail(modelId = "model-e") {
  const model = models.find((item) => item.id === modelId) || models[0];
  detailView.innerHTML = `
    <div class="detail-media">
      <div class="mini-car" style="--paint:${model.paint}"></div>
    </div>
    <aside class="detail-panel">
      <span class="eyebrow">车型详情页</span>
      <h2>${model.name}</h2>
      <p>${model.intro}</p>
      <div class="tag-row">${model.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      <div class="spec-grid">
        <div><span>月租</span><strong>${model.price}</strong></div>
        <div><span>押金</span><strong>${model.deposit}</strong></div>
        <div><span>续航/能源</span><strong>${model.range}</strong></div>
        <div><span>库存</span><strong>${model.stock}</strong></div>
      </div>
      <div class="summary-list">
        <div><span>车辆状态</span><strong>${model.status}</strong></div>
        <div><span>服务包含</span><strong>保险、保养、救援</strong></div>
      </div>
      <a class="primary-button wide" href="#plans" data-route="plans">选择订阅方案</a>
    </aside>
  `;
}

function renderPlans() {
  planGrid.innerHTML = plans
    .map(
      (plan) => `
        <article class="plan-card ${plan.featured ? "featured" : ""}">
          <span class="tag">${plan.badge}</span>
          <h3>${plan.name}</h3>
          <strong class="price">${plan.price}</strong>
          <p>押金随车型变化，审核通过后锁定库存。</p>
          <ul>${plan.perks.map((perk) => `<li>${perk}</li>`).join("")}</ul>
          <a class="primary-button wide" href="#apply" data-route="apply">选择该方案</a>
        </article>
      `
    )
    .join("");
}

function renderAdmin(moduleName = "vehicles") {
  const module = adminModules[moduleName];
  document.querySelector("#adminTitle").textContent = module.title;
  document.querySelector("#adminKpis").innerHTML = module.kpis
    .map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
  document.querySelector("#adminTableHead").innerHTML = `<tr>${module.columns
    .map((column) => `<th>${column}</th>`)
    .join("")}</tr>`;
  document.querySelector("#adminTableBody").innerHTML = module.rows
    .map(
      (row) => `
        <tr>
          ${row
            .map(
              (cell, index) =>
                `<td data-label="${module.columns[index]}">${index >= row.length - 2 ? `<span class="status">${cell}</span>` : cell}</td>`
            )
            .join("")}
        </tr>
      `
    )
    .join("");
}

document.addEventListener("click", (event) => {
  const routeLink = event.target.closest("[data-route]");
  if (routeLink) {
    routeTo(routeLink.dataset.route);
  }

  const modelLink = event.target.closest("[data-model]");
  if (modelLink) {
    renderDetail(modelLink.dataset.model);
    routeTo("detail");
  }

  const filter = event.target.closest(".filter");
  if (filter) {
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
    filter.classList.add("active");
    renderModels(filter.dataset.filter);
  }

  const adminTab = event.target.closest(".admin-tab");
  if (adminTab) {
    document.querySelectorAll(".admin-tab").forEach((item) => item.classList.remove("active"));
    adminTab.classList.add("active");
    renderAdmin(adminTab.dataset.admin);
  }

  const payMethod = event.target.closest(".pay-method");
  if (payMethod) {
    document.querySelectorAll(".pay-method").forEach((item) => item.classList.remove("active"));
    payMethod.classList.add("active");
  }
});

document.querySelector("#signButton").addEventListener("click", () => {
  const signature = document.querySelector(".signature-box");
  signature.classList.add("signed");
  signature.textContent = "已完成电子签署 · 2026-05-21";
});

window.addEventListener("hashchange", () => {
  const route = location.hash.replace("#", "") || "home";
  routeTo(route);
});

renderModels();
renderDetail();
renderPlans();
renderAdmin();
routeTo(location.hash.replace("#", "") || "home");
