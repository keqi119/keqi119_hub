const pages = [...document.querySelectorAll(".page")];
const navLinks = [...document.querySelectorAll("[data-route]")];
let currentFilter = "all";

function state() {
  return AppStore.load();
}

function activeOrder() {
  const data = state();
  return data.orders.find((item) => item.id === data.activeOrderId) || data.orders[0];
}

function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function routeTo(route) {
  const fallback = document.querySelector(`[data-page="${route}"]`) ? route : "home";
  pages.forEach((page) => page.classList.toggle("active", page.dataset.page === fallback));
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.route === fallback));
  if (fallback === "confirm") renderConfirm();
  if (fallback === "payment") renderPayment();
  if (fallback === "user") renderUserCenter();
  if (fallback === "contract") renderContract();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderHome() {
  const data = state();
  const available = data.models.reduce((sum, item) => sum + (item.status === "available" ? item.stock : 0), 0);
  document.querySelector("#homeAvailable").textContent = `${available} 台`;
}

function renderModels(filter = currentFilter) {
  currentFilter = filter;
  const data = state();
  const visible = data.models.filter((model) => {
    if (filter === "all") return true;
    if (filter === "available") return model.status === "available" && model.stock > 0;
    return model.type.includes(filter);
  });
  document.querySelector("#modelGrid").innerHTML = visible
    .map((model) => {
      const disabled = model.status !== "available" || model.stock <= 0;
      return `
        <article class="model-card">
          <div class="model-image"><div class="mini-car" style="--paint:${model.paint}"></div></div>
          <div>
            <div class="tag-row">${model.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
            <h3>${model.name}</h3>
            <p>${model.intro}</p>
          </div>
          <div class="card-foot">
            <div>
              <strong class="price">${AppStore.money(model.monthlyRent)}/月</strong>
              <p>押金 ${AppStore.money(model.deposit)} · ${model.city} ${model.stock} 台</p>
            </div>
            <button class="secondary-button" data-model="${model.id}" ${disabled ? "disabled" : ""}>详情</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDetail(modelId) {
  const data = state();
  const model = AppStore.getModel(data, modelId || data.selectedModelId);
  data.selectedModelId = model.id;
  AppStore.save(data);
  document.querySelector("#detailView").innerHTML = `
    <div class="detail-media"><div class="mini-car" style="--paint:${model.paint}"></div></div>
    <aside class="detail-panel">
      <span class="eyebrow">车型详情页</span>
      <h2>${model.name}</h2>
      <p>${model.intro}</p>
      <div class="tag-row">${model.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      <div class="spec-grid">
        <div><span>月租</span><strong>${AppStore.money(model.monthlyRent)}/月</strong></div>
        <div><span>押金</span><strong>${AppStore.money(model.deposit)}</strong></div>
        <div><span>续航/能源</span><strong>${model.range}</strong></div>
        <div><span>库存</span><strong>${model.city} ${model.stock} 台</strong></div>
      </div>
      <div class="summary-list">
        <div><span>车辆状态</span><strong>${model.status === "available" ? "现车可订" : "需审核排期"}</strong></div>
        <div><span>服务包含</span><strong>保险、保养、道路救援</strong></div>
      </div>
      <a class="primary-button wide" href="#plans" data-route="plans">选择订阅方案</a>
    </aside>
  `;
}

function renderPlans() {
  const data = state();
  const model = AppStore.getModel(data, data.selectedModelId);
  document.querySelector("#planGrid").innerHTML = data.plans
    .map((plan) => {
      const rent = AppStore.monthlyRent(model, plan);
      return `
        <article class="plan-card ${plan.featured ? "featured" : ""}">
          <span class="tag">${plan.badge}</span>
          <h3>${plan.name}</h3>
          <strong class="price">${AppStore.money(rent)}/月</strong>
          <p>押金 ${AppStore.money(model.deposit)}，审核通过后锁定库存。</p>
          <ul>${plan.perks.map((perk) => `<li>${perk}</li>`).join("")}</ul>
          <button class="primary-button wide" data-plan="${plan.id}">选择该方案</button>
        </article>
      `;
    })
    .join("");
}

function renderApplyOptions() {
  const data = state();
  document.querySelector("#applyModel").innerHTML = data.models
    .map((model) => `<option value="${model.id}" ${model.id === data.selectedModelId ? "selected" : ""}>${model.name}</option>`)
    .join("");
  document.querySelector("#applyPlan").innerHTML = data.plans
    .map((plan) => `<option value="${plan.id}" ${plan.id === data.selectedPlanId ? "selected" : ""}>${plan.name}</option>`)
    .join("");
  document.querySelector('[name="startDate"]').value ||= new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10);
}

function renderConfirm() {
  const data = state();
  const order = activeOrder();
  if (!order) return;
  const model = AppStore.getModel(data, order.modelId);
  const plan = AppStore.getPlan(data, order.planId);
  const rent = AppStore.monthlyRent(model, plan);
  document.querySelector("#orderSummary").innerHTML = `
    <div><span>订单号</span><strong>${order.id}</strong></div>
    <div><span>车型</span><strong>${model.name}</strong></div>
    <div><span>周期</span><strong>${plan.months} 个月</strong></div>
    <div><span>月租</span><strong>${AppStore.money(rent)}/月</strong></div>
    <div><span>押金</span><strong>${AppStore.money(model.deposit)}</strong></div>
    <div><span>交付城市</span><strong>${order.city}</strong></div>
  `;
  document.querySelector("#feeSummary").innerHTML = `
    <div class="price-line"><span>押金</span><strong>${AppStore.money(model.deposit)}</strong></div>
    <div class="price-line"><span>首期月租</span><strong>${AppStore.money(rent)}</strong></div>
    <div class="price-total"><span>本次应付</span><strong>${AppStore.money(model.deposit + rent)}</strong></div>
  `;
}

function renderPayment() {
  const data = state();
  const order = activeOrder();
  document.querySelector("#payAmount").textContent = order ? AppStore.money(AppStore.orderTotal(data, order)) : "--";
}

function renderUserCenter() {
  const data = state();
  const order = activeOrder();
  const container = document.querySelector("#userCenter");
  if (!order) {
    container.innerHTML = `<div class="empty-state"><h3>暂无订单</h3><p>选择车型并提交申请后，这里会展示订阅进度。</p></div>`;
    return;
  }
  const model = AppStore.getModel(data, order.modelId);
  const plan = AppStore.getPlan(data, order.planId);
  const steps = ["申请", "资料", "审核", "签约", "交付"];
  const active = order.deliveryStatus === "delivered" ? 4 : order.contractStatus === "signed" ? 4 : order.status === "contract_pending" ? 3 : order.docs?.submitted ? 2 : 1;
  container.innerHTML = `
    <div class="user-card">
      <div>
        <h3>${model.name}</h3>
        <p>订单号：${order.id} · 状态：${AppStore.orderStage(order)} · ${plan.name}</p>
      </div>
      <a class="secondary-button" href="#contract" data-route="contract">查看合同</a>
    </div>
    <div class="progress-line">
      ${steps.map((step, index) => `<span class="${index < active ? "done" : index === active ? "active" : ""}">${step}</span>`).join("")}
    </div>
    <div class="metric-grid">
      <article><span>下次账单</span><strong>${order.startDate}</strong></article>
      <article><span>月租</span><strong>${AppStore.money(AppStore.monthlyRent(model, plan))}</strong></article>
      <article><span>资料状态</span><strong>${order.docs?.verified ? "已通过" : order.docs?.submitted ? "审核中" : "待上传"}</strong></article>
    </div>
  `;
}

function renderContract() {
  const data = state();
  const order = activeOrder();
  const doc = document.querySelector("#contractDoc");
  if (!order) {
    doc.innerHTML = `<h2>暂无合同</h2><p>提交申请并确认订单后会自动生成合同。</p>`;
    return;
  }
  const model = AppStore.getModel(data, order.modelId);
  const plan = AppStore.getPlan(data, order.planId);
  const contract = data.contracts.find((item) => item.orderId === order.id);
  document.querySelector("#contractStatus").textContent = contract?.status === "signed" ? "已签署" : "待签署";
  document.querySelector("#signButton").disabled = contract?.status === "signed";
  doc.innerHTML = `
    <span>汽车订阅服务合同</span>
    <h2>星途订阅平台车辆订阅协议</h2>
    <p>甲方为车辆订阅服务提供方，乙方为订阅用户。双方确认车辆、费用、交付、保险、违约与退订规则，并通过电子签名完成合同确认。</p>
    <div class="contract-clause">1. 订阅车辆：${model.name}，车架号由后台交付时分配。</div>
    <div class="contract-clause">2. 订阅周期：${plan.months} 个月，月租 ${AppStore.money(AppStore.monthlyRent(model, plan))}，押金 ${AppStore.money(model.deposit)}。</div>
    <div class="contract-clause">3. 费用支付：真实支付接口未接入，当前生成待支付账单供后台确认。</div>
    <div class="signature-box ${contract?.status === "signed" ? "signed" : ""}">${contract?.status === "signed" ? `已完成电子签署 · ${contract.signedAt}` : "点击右侧按钮完成电子签署"}</div>
  `;
}

function bindForms() {
  document.querySelector("#applyForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const order = AppStore.createOrder(Object.fromEntries(form.entries()));
    toast(`申请已提交，订单 ${order.id}`);
    routeTo("upload");
  });

  document.querySelector("#uploadForm").addEventListener("change", (event) => {
    const input = event.target;
    const map = { identity: "idDocName", license: "licenseDocName", risk: "riskDocName" };
    if (map[input.name]) {
      document.querySelector(`#${map[input.name]}`).textContent = input.files[0]?.name || "未选择文件";
    }
  });

  document.querySelector("#submitDocsButton").addEventListener("click", () => {
    const form = document.querySelector("#uploadForm");
    const order = activeOrder();
    if (!order) return toast("请先提交申请");
    const docs = {
      identity: form.identity.files[0]?.name,
      license: form.license.files[0]?.name,
      risk: form.risk.files[0]?.name || "未上传"
    };
    if (!docs.identity || !docs.license) return toast("请上传身份证和驾驶证资料");
    AppStore.updateDocs(order.id, docs);
    toast("资料已提交，等待后台审核");
    routeTo("confirm");
  });

  document.querySelector("#confirmOrderButton").addEventListener("click", () => {
    const order = activeOrder();
    AppStore.confirmOrder(order.id);
    toast("订单已确认，合同已生成");
    routeTo("payment");
  });

  document.querySelector("#mockPaymentButton").addEventListener("click", () => {
    const order = activeOrder();
    AppStore.createPendingPayment(order.id);
    toast("待支付账单已生成，后台支付管理已同步");
    routeTo("user");
  });

  document.querySelector("#signButton").addEventListener("click", () => {
    const order = activeOrder();
    const latest = state().orders.find((item) => item.id === order.id);
    if (latest.status !== "contract_pending" && latest.status !== "delivery_pending") {
      return toast("请等待后台审核通过后再签署合同");
    }
    AppStore.signContract(order.id);
    toast("合同已签署，后台合同状态已同步");
    renderContract();
  });

  document.querySelector("#downloadContractButton").addEventListener("click", () => {
    toast("演示环境已生成合同文本，生产环境可接入 PDF 下载服务");
  });
}

document.addEventListener("click", (event) => {
  const routeLink = event.target.closest("[data-route]");
  if (routeLink) routeTo(routeLink.dataset.route);

  const modelLink = event.target.closest("[data-model]");
  if (modelLink) {
    renderDetail(modelLink.dataset.model);
    routeTo("detail");
  }

  const planButton = event.target.closest("[data-plan]");
  if (planButton) {
    const data = state();
    data.selectedPlanId = planButton.dataset.plan;
    AppStore.save(data);
    renderApplyOptions();
    routeTo("apply");
  }

  const filter = event.target.closest(".filter");
  if (filter) {
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
    filter.classList.add("active");
    renderModels(filter.dataset.filter);
  }

  const payMethod = event.target.closest(".pay-method");
  if (payMethod) {
    document.querySelectorAll(".pay-method").forEach((item) => item.classList.remove("active"));
    payMethod.classList.add("active");
  }
});

window.addEventListener("hashchange", () => routeTo(location.hash.replace("#", "") || "home"));
window.addEventListener("subscription-state-change", () => {
  renderHome();
  renderModels();
  renderPlans();
  renderUserCenter();
});

renderHome();
renderModels();
renderDetail();
renderPlans();
renderApplyOptions();
renderUserCenter();
renderContract();
bindForms();
routeTo(location.hash.replace("#", "") || "home");
