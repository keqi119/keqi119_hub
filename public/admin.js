if (!AppStore.isLoggedIn()) {
  location.replace("./admin-login.html");
}

let activeModule = "orders";
let selectedId = "";
let query = "";
let statusFilter = "all";

const moduleMeta = {
  vehicles: {
    title: "车辆管理",
    subtitle: "生产级测试车辆台账：车型、车架号前缀、库存城市、可订库存和上下架状态。",
    primary: "新增车型",
    statuses: [["available", "可订"], ["review", "需审核"], ["offline", "下架"]]
  },
  pricing: {
    title: "价格管理",
    subtitle: "维护月租、押金、订阅周期和优惠系数，客户前端方案价格实时读取。",
    primary: "新增价格方案",
    statuses: [["all", "全部状态"]]
  },
  orders: {
    title: "订单管理",
    subtitle: "测试订单的申请、审核、签约、支付、交付、退订全链路操作台。",
    primary: "创建测试订单",
    statuses: [["docs_pending", "资料待上传"], ["reviewing", "审核中"], ["contract_pending", "待签约"], ["delivery_pending", "待交付"], ["delivered", "已交付"], ["cancelled", "已退订"], ["rejected", "已拒绝"]]
  },
  customers: {
    title: "客户管理",
    subtitle: "客户身份、驾驶证、风控资料、订单历史和黑名单管理。",
    primary: "新增客户",
    statuses: [["verified", "实名通过"], ["pending", "待完善"], ["blocked", "黑名单"]]
  },
  contracts: {
    title: "合同管理",
    subtitle: "合同模板、电子签、签署状态和下载记录，关联订单签约节点。",
    primary: "生成合同",
    statuses: [["pending", "待签署"], ["signed", "已签署"], ["void", "已作废"]]
  },
  payments: {
    title: "支付管理",
    subtitle: "押金、首期月租、退款和逾期账单的测试结算台账。",
    primary: "新增账单",
    statuses: [["pending", "待支付"], ["paid", "已支付"], ["overdue", "已逾期"], ["refunded", "已退款"]]
  },
  risk: {
    title: "风控审核",
    subtitle: "资料校验、黑名单、人工审核和审核结论，直接控制客户能否签约。",
    primary: "批量审核",
    statuses: [["reviewing", "待审核"], ["approved", "已通过"], ["rejected", "已拒绝"], ["high", "高风险"]]
  },
  analytics: {
    title: "运营数据",
    subtitle: "转化率、库存周转、逾期率、签约率和交付效率的实时测试指标。",
    primary: "刷新指标",
    statuses: [["all", "全部指标"]]
  }
};

function data() {
  return AppStore.load();
}

function save(nextState) {
  AppStore.save(nextState);
}

function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.adminToastTimer);
  window.adminToastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function statusLabel(value) {
  const map = {
    available: "可订",
    review: "需审核",
    offline: "下架",
    docs_pending: "资料待上传",
    reviewing: "审核中",
    approved: "审核通过",
    rejected: "已拒绝",
    contract_pending: "待签约",
    delivery_pending: "待交付",
    delivered: "已交付",
    cancelled: "已退订",
    pending: "待处理",
    paid: "已支付",
    overdue: "已逾期",
    refunded: "已退款",
    signed: "已签署",
    void: "已作废",
    verified: "已认证",
    blocked: "黑名单",
    not_created: "未生成",
    uncreated: "未创建",
    high: "高风险",
    low: "低风险"
  };
  return map[value] || value || "-";
}

function row(id, cells, status, searchText) {
  return { id, cells, status, searchText: String(searchText || cells.join(" ")).toLowerCase() };
}

function nextId(prefix, list) {
  const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const count = list.filter((item) => String(item.id).includes(today)).length + 1;
  return `${prefix}${today}${String(count).padStart(3, "0")}`;
}

function orderOf(state, orderId) {
  return state.orders.find((item) => item.id === orderId);
}

function paymentOf(state, orderId) {
  return state.payments.find((item) => item.orderId === orderId);
}

function contractOf(state, orderId) {
  return state.contracts.find((item) => item.orderId === orderId);
}

function moduleRows() {
  const state = data();
  const rows = {
    vehicles: state.models.map((model) => row(model.id, [model.name, `${model.vinPrefix}******`, model.city, `${model.stock} 台`, statusLabel(model.status)], model.status, `${model.name} ${model.city} ${model.vinPrefix}`)),
    pricing: state.plans.map((plan) => row(plan.id, [plan.name, `${plan.months} 个月`, plan.discount, AppStore.money(Math.round(state.models[0].monthlyRent * plan.discount)), plan.perks.join(" / ")], "all", plan.name)),
    orders: state.orders.map((order) => {
      const model = AppStore.getModel(state, order.modelId);
      const plan = AppStore.getPlan(state, order.planId);
      return row(order.id, [order.id, order.customerName, model.name, plan.name, AppStore.orderStage(order)], order.status, `${order.id} ${order.customerName} ${order.phone} ${model.name}`);
    }),
    customers: state.users.map((user) => row(user.id, [user.name, user.phone, statusLabel(user.identityStatus), statusLabel(user.licenseStatus), statusLabel(user.riskStatus)], state.blacklist.includes(user.phone) ? "blocked" : user.identityStatus, `${user.name} ${user.phone}`)),
    contracts: state.contracts.map((contract) => row(contract.id, [contract.id, contract.orderId, contract.template, statusLabel(contract.status), contract.signedAt || "-"], contract.status, `${contract.id} ${contract.orderId}`)),
    payments: state.payments.map((payment) => row(payment.id, [payment.id, payment.orderId, payment.type, AppStore.money(payment.amount), statusLabel(payment.status)], payment.status, `${payment.id} ${payment.orderId} ${payment.type}`)),
    risk: state.orders.map((order) => {
      const risk = state.blacklist.includes(order.phone) ? "high" : order.status === "rejected" ? "rejected" : order.docs?.verified ? "approved" : "reviewing";
      return row(order.id, [order.id, order.customerName, order.docs?.submitted ? "已提交" : "未提交", statusLabel(risk), statusLabel(order.status)], risk, `${order.id} ${order.customerName} ${order.phone}`);
    }),
    analytics: analyticsRows(state)
  };
  return rows[activeModule] || [];
}

function analyticsRows(state) {
  const orders = state.orders;
  const confirmed = orders.filter((item) => item.confirmed).length;
  const signed = orders.filter((item) => item.contractStatus === "signed").length;
  const delivered = orders.filter((item) => item.deliveryStatus === "delivered").length;
  const paid = state.payments.filter((item) => item.status === "paid").length;
  return [
    row("conversion", ["申请转化率", percent(confirmed, orders.length), "确认订单/申请订单", "用于验证投放质量"], "all"),
    row("sign-rate", ["签约率", percent(signed, confirmed), "已签署/已确认", "用于评估审核与合同效率"], "all"),
    row("delivery-rate", ["交付完成率", percent(delivered, signed), "已交付/已签署", "用于评估交付履约"], "all"),
    row("payment-rate", ["支付确认率", percent(paid, state.payments.length), "已支付/账单数", "支付接口接入前用后台确认"], "all"),
    row("inventory", ["可订库存", state.models.reduce((sum, item) => sum + item.stock, 0), "全部车型库存", "影响客户前端车型列表"], "all")
  ];
}

function percent(part, total) {
  return total ? `${Math.round((part / total) * 1000) / 10}%` : "0%";
}

function filteredRows() {
  return moduleRows().filter((item) => {
    const statusOk = statusFilter === "all" || item.status === statusFilter;
    const queryOk = !query || item.searchText.includes(query.toLowerCase());
    return statusOk && queryOk;
  });
}

function columnsFor(moduleName) {
  const columns = {
    vehicles: ["车型", "车架号前缀", "库存城市", "库存", "状态"],
    pricing: ["方案", "周期", "优惠系数", "参考月租", "权益"],
    orders: ["订单号", "客户", "车型", "方案", "阶段"],
    customers: ["客户", "手机号", "身份", "驾驶证", "风控"],
    contracts: ["合同编号", "订单号", "模板", "签署状态", "签署时间"],
    payments: ["流水号", "订单号", "类型", "金额", "状态"],
    risk: ["订单号", "客户", "资料", "风险等级", "处理状态"],
    analytics: ["指标", "本期", "口径", "说明"]
  };
  return columns[moduleName];
}

function kpisFor(moduleName) {
  const state = data();
  const orders = state.orders;
  const paidAmount = state.payments.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0);
  const pendingAmount = state.payments.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.amount, 0);
  const kpis = {
    vehicles: [["车型数量", state.models.length], ["可订库存", state.models.reduce((sum, item) => sum + item.stock, 0)], ["下架/待审", state.models.filter((item) => item.status !== "available").length]],
    pricing: [["方案数量", state.plans.length], ["平均基础月租", AppStore.money(Math.round(state.models.reduce((sum, item) => sum + item.monthlyRent, 0) / state.models.length))], ["优惠方案", state.plans.filter((item) => item.discount < 1).length]],
    orders: [["订单总数", orders.length], ["待审核", orders.filter((item) => item.status === "reviewing").length], ["待交付", orders.filter((item) => item.status === "delivery_pending").length]],
    customers: [["客户数量", state.users.length], ["实名通过", state.users.filter((item) => item.identityStatus === "verified").length], ["黑名单", state.blacklist.length]],
    contracts: [["合同数量", state.contracts.length], ["待电子签", state.contracts.filter((item) => item.status !== "signed").length], ["已签署", state.contracts.filter((item) => item.status === "signed").length]],
    payments: [["已收金额", AppStore.money(paidAmount)], ["待收金额", AppStore.money(pendingAmount)], ["账单数量", state.payments.length]],
    risk: [["人工审核", orders.filter((item) => item.status === "reviewing").length], ["黑名单命中", orders.filter((item) => state.blacklist.includes(item.phone)).length], ["资料提交", orders.filter((item) => item.docs?.submitted).length]],
    analytics: [["转化率", percent(orders.filter((item) => item.confirmed).length, orders.length)], ["签约率", percent(orders.filter((item) => item.contractStatus === "signed").length, orders.filter((item) => item.confirmed).length)], ["逾期率", "1.9%"]]
  };
  return kpis[moduleName];
}

function renderAdmin() {
  const meta = moduleMeta[activeModule];
  document.querySelectorAll("[data-admin]").forEach((item) => item.classList.toggle("active", item.dataset.admin === activeModule));
  document.querySelector("#adminTitle").textContent = meta.title;
  document.querySelector("#adminSubtitle").textContent = meta.subtitle;
  document.querySelector("#adminPrimaryAction").textContent = meta.primary;
  renderFilters(meta);
  renderKpis();
  renderTable();
  renderDetail();
}

function renderFilters(meta) {
  const select = document.querySelector("#adminStatusFilter");
  const options = [["all", "全部状态"], ...meta.statuses.filter(([value]) => value !== "all")];
  select.innerHTML = options.map(([value, label]) => `<option value="${value}" ${value === statusFilter ? "selected" : ""}>${label}</option>`).join("");
}

function renderKpis() {
  document.querySelector("#adminKpis").innerHTML = kpisFor(activeModule)
    .map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderTable() {
  const columns = columnsFor(activeModule);
  const rows = filteredRows();
  document.querySelector("#adminTableHead").innerHTML = `<tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr>`;
  document.querySelector("#adminTableBody").innerHTML = rows
    .map((item) => `
      <tr class="${item.id === selectedId ? "selected-row" : ""}" data-open="${item.id}">
        ${item.cells.map((cell, index) => `<td data-label="${columns[index]}">${index >= item.cells.length - 2 ? `<span class="status">${cell}</span>` : cell}</td>`).join("")}
      </tr>
    `)
    .join("") || `<tr><td data-label="结果" colspan="${columns.length}">没有符合条件的数据</td></tr>`;
}

function renderDetail() {
  const detail = document.querySelector("#adminDetail");
  const id = selectedId || filteredRows()[0]?.id || "";
  selectedId = id;
  if (!id) {
    detail.innerHTML = `<div class="empty-state"><h3>暂无记录</h3><p>请调整筛选条件或新增测试数据。</p></div>`;
    return;
  }
  const renderers = {
    vehicles: renderVehicleDetail,
    pricing: renderPricingDetail,
    orders: renderOrderDetail,
    customers: renderCustomerDetail,
    contracts: renderContractDetail,
    payments: renderPaymentDetail,
    risk: renderRiskDetail,
    analytics: renderAnalyticsDetail
  };
  detail.innerHTML = renderers[activeModule](id);
}

function field(label, value) {
  return `<div class="detail-field"><span>${label}</span><strong>${value ?? "-"}</strong></div>`;
}

function renderVehicleDetail(id) {
  const state = data();
  const model = state.models.find((item) => item.id === id);
  const related = state.orders.filter((order) => order.modelId === id);
  return `
    <div class="detail-head"><span class="eyebrow">车型二级页</span><h2>${model.name}</h2><p>${model.intro}</p></div>
    <form class="detail-form" data-form="vehicle" data-id="${model.id}">
      <label>车型名称<input name="name" value="${model.name}" required /></label>
      <label>库存城市<input name="city" value="${model.city}" required /></label>
      <label>月租<input name="monthlyRent" type="number" min="0" value="${model.monthlyRent}" required /></label>
      <label>押金<input name="deposit" type="number" min="0" value="${model.deposit}" required /></label>
      <label>库存<input name="stock" type="number" min="0" value="${model.stock}" required /></label>
      <label>状态<select name="status"><option value="available" ${model.status === "available" ? "selected" : ""}>可订</option><option value="review" ${model.status === "review" ? "selected" : ""}>需审核</option><option value="offline" ${model.status === "offline" ? "selected" : ""}>下架</option></select></label>
      <button class="primary-button wide" type="submit">保存车型</button>
    </form>
    <div class="detail-grid">${field("关联订单", `${related.length} 单`)}${field("车架号前缀", model.vinPrefix)}${field("前端展示", model.status === "available" && model.stock > 0 ? "可展示" : "隐藏/需审核")}</div>
  `;
}

function renderPricingDetail(id) {
  const state = data();
  const plan = state.plans.find((item) => item.id === id);
  return `
    <div class="detail-head"><span class="eyebrow">价格二级页</span><h2>${plan.name}</h2><p>价格保存后，客户前端订阅方案立即按新系数计算。</p></div>
    <form class="detail-form" data-form="plan" data-id="${plan.id}">
      <label>方案名称<input name="name" value="${plan.name}" required /></label>
      <label>周期（月）<input name="months" type="number" min="1" value="${plan.months}" required /></label>
      <label>优惠系数<input name="discount" type="number" min="0.1" step="0.01" value="${plan.discount}" required /></label>
      <label>标签<input name="badge" value="${plan.badge}" required /></label>
      <label class="full-span">权益说明<textarea name="perks">${plan.perks.join("\n")}</textarea></label>
      <button class="primary-button wide" type="submit">保存价格方案</button>
    </form>
    <div class="detail-grid">${state.models.map((model) => field(model.name, `${AppStore.money(AppStore.monthlyRent(model, plan))}/月`)).join("")}</div>
  `;
}

function renderOrderDetail(id) {
  const state = data();
  const order = orderOf(state, id);
  const model = AppStore.getModel(state, order.modelId);
  const plan = AppStore.getPlan(state, order.planId);
  const payment = paymentOf(state, order.id);
  const contract = contractOf(state, order.id);
  return `
    <div class="detail-head"><span class="eyebrow">订单二级页</span><h2>${order.id}</h2><p>${order.customerName} · ${model.name} · ${AppStore.orderStage(order)}</p></div>
    <div class="detail-grid">
      ${field("客户", `${order.customerName} ${order.phone}`)}
      ${field("订阅方案", plan.name)}
      ${field("交付城市", order.city)}
      ${field("开始时间", order.startDate)}
      ${field("资料", order.docs?.submitted ? order.docs.verified ? "已审核通过" : "待审核" : "未提交")}
      ${field("合同", contract ? statusLabel(contract.status) : "未生成")}
      ${field("支付", payment ? statusLabel(payment.status) : "未创建")}
      ${field("应收", AppStore.money(AppStore.orderTotal(state, order)))}
    </div>
    <div class="detail-actions">
      <button class="primary-button" data-action="approve" data-order="${order.id}">审核通过</button>
      <button class="secondary-button danger-action" data-action="reject" data-order="${order.id}">拒绝申请</button>
      <button class="secondary-button" data-action="mark-paid" data-order="${order.id}">确认支付</button>
      <button class="secondary-button" data-action="deliver" data-order="${order.id}">确认交付</button>
      <button class="secondary-button danger-action" data-action="cancel" data-order="${order.id}">办理退订</button>
    </div>
    <form class="detail-form" data-form="order-note" data-id="${order.id}">
      <label class="full-span">审核备注<textarea name="note">${order.note || ""}</textarea></label>
      <button class="secondary-button wide" type="submit">保存备注</button>
    </form>
  `;
}

function renderCustomerDetail(id) {
  const state = data();
  const user = state.users.find((item) => item.id === id);
  const orders = state.orders.filter((order) => order.userId === id);
  const blocked = state.blacklist.includes(user.phone);
  return `
    <div class="detail-head"><span class="eyebrow">客户二级页</span><h2>${user.name}</h2><p>${user.phone} · ${blocked ? "黑名单客户" : "正常客户"}</p></div>
    <div class="detail-grid">
      ${field("身份信息", statusLabel(user.identityStatus))}
      ${field("驾驶证", statusLabel(user.licenseStatus))}
      ${field("风控资料", statusLabel(user.riskStatus))}
      ${field("历史订单", `${orders.length} 单`)}
    </div>
    <div class="detail-actions">
      <button class="primary-button" data-customer-action="verify" data-user="${user.id}">资料标记通过</button>
      <button class="secondary-button danger-action" data-customer-action="${blocked ? "unblock" : "block"}" data-user="${user.id}">${blocked ? "移出黑名单" : "加入黑名单"}</button>
    </div>
    <div class="mini-list">${orders.map((order) => `<button data-switch-module="orders" data-select="${order.id}">${order.id} · ${AppStore.orderStage(order)}</button>`).join("") || "暂无订单"}</div>
  `;
}

function renderContractDetail(id) {
  const state = data();
  const contract = state.contracts.find((item) => item.id === id);
  const order = orderOf(state, contract.orderId);
  return `
    <div class="detail-head"><span class="eyebrow">合同二级页</span><h2>${contract.id}</h2><p>订单 ${contract.orderId} · ${statusLabel(contract.status)}</p></div>
    <div class="detail-grid">
      ${field("模板", contract.template)}
      ${field("签署状态", statusLabel(contract.status))}
      ${field("签署时间", contract.signedAt || "-")}
      ${field("客户", order?.customerName || "-")}
    </div>
    <div class="detail-actions">
      <button class="primary-button" data-contract-action="resend" data-contract="${contract.id}">重发签署链接</button>
      <button class="secondary-button" data-contract-action="download" data-contract="${contract.id}">下载合同</button>
      <button class="secondary-button danger-action" data-contract-action="void" data-contract="${contract.id}">作废合同</button>
    </div>
  `;
}

function renderPaymentDetail(id) {
  const state = data();
  const payment = state.payments.find((item) => item.id === id);
  const order = orderOf(state, payment.orderId);
  return `
    <div class="detail-head"><span class="eyebrow">支付二级页</span><h2>${payment.id}</h2><p>${payment.type} · ${AppStore.money(payment.amount)}</p></div>
    <div class="detail-grid">
      ${field("订单号", payment.orderId)}
      ${field("客户", order?.customerName || "-")}
      ${field("状态", statusLabel(payment.status))}
      ${field("渠道", payment.channel)}
      ${field("到期日", payment.dueDate)}
      ${field("金额", AppStore.money(payment.amount))}
    </div>
    <div class="detail-actions">
      <button class="primary-button" data-action="mark-paid" data-order="${payment.orderId}">确认支付</button>
      <button class="secondary-button danger-action" data-payment-action="refund" data-payment="${payment.id}">登记退款</button>
      <button class="secondary-button danger-action" data-payment-action="overdue" data-payment="${payment.id}">标记逾期</button>
    </div>
  `;
}

function renderRiskDetail(id) {
  const state = data();
  const order = orderOf(state, id);
  const highRisk = state.blacklist.includes(order.phone);
  return `
    <div class="detail-head"><span class="eyebrow">风控二级页</span><h2>${order.id}</h2><p>${order.customerName} · ${highRisk ? "黑名单命中" : "低风险"}</p></div>
    <div class="detail-grid">
      ${field("身份证", order.docs?.identity || "未上传")}
      ${field("驾驶证", order.docs?.license || "未上传")}
      ${field("风控资料", order.docs?.risk || "未上传")}
      ${field("校验结果", order.docs?.verified ? "已通过" : "待人工审核")}
      ${field("黑名单", highRisk ? "命中" : "未命中")}
    </div>
    <div class="detail-actions">
      <button class="primary-button" data-action="approve" data-order="${order.id}">人工通过</button>
      <button class="secondary-button danger-action" data-action="reject" data-order="${order.id}">人工拒绝</button>
    </div>
  `;
}

function renderAnalyticsDetail(id) {
  const item = analyticsRows(data()).find((rowItem) => rowItem.id === id) || analyticsRows(data())[0];
  return `
    <div class="detail-head"><span class="eyebrow">运营指标二级页</span><h2>${item.cells[0]}</h2><p>${item.cells[3]}</p></div>
    <div class="detail-grid">
      ${field("当前值", item.cells[1])}
      ${field("统计口径", item.cells[2])}
      ${field("更新方式", "基于本地测试订单实时计算")}
    </div>
    <div class="empty-state"><h3>上线测试说明</h3><p>创建测试订单并完成审核、签署、支付确认和交付后，该指标会立即变化。</p></div>
  `;
}

function updateModel(form, id) {
  const state = data();
  const model = state.models.find((item) => item.id === id);
  model.name = form.get("name").trim();
  model.city = form.get("city").trim();
  model.monthlyRent = Number(form.get("monthlyRent"));
  model.deposit = Number(form.get("deposit"));
  model.stock = Number(form.get("stock"));
  model.status = form.get("status");
  save(state);
}

function updatePlan(form, id) {
  const state = data();
  const plan = state.plans.find((item) => item.id === id);
  plan.name = form.get("name").trim();
  plan.months = Number(form.get("months"));
  plan.discount = Number(form.get("discount"));
  plan.badge = form.get("badge").trim();
  plan.perks = form.get("perks").split("\n").map((item) => item.trim()).filter(Boolean);
  save(state);
}

function performOrderAction(orderId, actionName) {
  const state = data();
  const order = orderOf(state, orderId);
  if (!order) return "订单不存在";
  const payment = paymentOf(state, orderId);
  const contract = contractOf(state, orderId);
  if (actionName === "approve" && !order.docs?.submitted) return "资料未提交，不能审核通过";
  if (actionName === "mark-paid" && !payment) {
    state.payments.unshift({
      id: nextId("PAY", state.payments),
      orderId: order.id,
      type: "押金+首期月租",
      amount: AppStore.orderTotal(state, order),
      status: "pending",
      channel: "后台创建",
      dueDate: order.startDate
    });
    save(state);
  }
  if (actionName === "deliver") {
    if (order.contractStatus !== "signed") return "合同未签署，不能交付";
    if (order.paymentStatus !== "paid") return "账单未确认支付，不能交付";
  }
  if (actionName === "cancel") {
    order.status = "cancelled";
    order.deliveryStatus = "cancelled";
    if (payment && payment.status === "paid") payment.status = "refunded";
    save(state);
    return "退订已办理";
  }
  AppStore.adminUpdateOrder(orderId, actionName);
  return "业务状态已保存，并同步客户前端";
}

function handlePrimaryAction() {
  const state = data();
  if (activeModule === "vehicles") {
    const id = `model-${Date.now()}`;
    state.models.unshift({ id, name: "新增测试车型", type: ["ev", "available"], monthlyRent: 3999, deposit: 10000, range: "500 km", city: "上海", stock: 1, vinPrefix: "LST", status: "review", paint: "#106bff", tags: ["测试", "待完善"], intro: "用于上线前测试的新增车型。" });
    selectedId = id;
  } else if (activeModule === "pricing") {
    const id = `plan-${Date.now()}`;
    state.plans.unshift({ id, name: "新增测试方案", months: 18, discount: 1, badge: "测试", perks: ["基础保险", "免费保养"] });
    selectedId = id;
  } else if (activeModule === "orders") {
    const order = AppStore.createOrder({ modelId: state.models[0].id, planId: state.plans[0].id, city: state.models[0].city, startDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10), name: "测试客户", phone: `138${String(Date.now()).slice(-8)}`, note: "后台创建测试订单" });
    selectedId = order.id;
    toast("测试订单已创建");
    renderAdmin();
    return;
  } else if (activeModule === "contracts") {
    const order = state.orders.find((item) => !state.contracts.some((contract) => contract.orderId === item.id));
    if (!order) return toast("没有可生成合同的订单");
    state.contracts.unshift({ id: nextId("CT", state.contracts), orderId: order.id, template: "个人标准版", status: "pending", signedAt: "" });
    order.contractStatus = "pending";
    selectedId = state.contracts[0].id;
  } else if (activeModule === "payments") {
    const order = state.orders[0];
    if (!order) return toast("没有可创建账单的订单");
    state.payments.unshift({ id: nextId("PAY", state.payments), orderId: order.id, type: "押金+首期月租", amount: AppStore.orderTotal(state, order), status: "pending", channel: "后台创建", dueDate: order.startDate });
    selectedId = state.payments[0].id;
  } else {
    toast("当前模块已刷新");
  }
  save(state);
  renderAdmin();
}

document.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-admin]");
  if (tab) {
    activeModule = tab.dataset.admin;
    selectedId = "";
    statusFilter = "all";
    document.querySelectorAll("[data-admin]").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    renderAdmin();
  }

  const rowEl = event.target.closest("[data-open]");
  if (rowEl) {
    selectedId = rowEl.dataset.open;
    renderTable();
    renderDetail();
  }

  const action = event.target.closest("[data-action]");
  if (action) {
    toast(performOrderAction(action.dataset.order, action.dataset.action));
    renderAdmin();
  }

  const customerAction = event.target.closest("[data-customer-action]");
  if (customerAction) {
    const state = data();
    const user = state.users.find((item) => item.id === customerAction.dataset.user);
    if (customerAction.dataset.customerAction === "verify") {
      user.identityStatus = "verified";
      user.licenseStatus = "verified";
      user.riskStatus = "approved";
    }
    if (customerAction.dataset.customerAction === "block" && !state.blacklist.includes(user.phone)) state.blacklist.push(user.phone);
    if (customerAction.dataset.customerAction === "unblock") state.blacklist = state.blacklist.filter((phone) => phone !== user.phone);
    save(state);
    toast("客户资料已更新");
    renderAdmin();
  }

  const contractAction = event.target.closest("[data-contract-action]");
  if (contractAction) {
    const state = data();
    const contract = state.contracts.find((item) => item.id === contractAction.dataset.contract);
    if (contractAction.dataset.contractAction === "void") contract.status = "void";
    toast(contractAction.dataset.contractAction === "download" ? "合同下载任务已生成" : "合同状态已更新");
    save(state);
    renderAdmin();
  }

  const paymentAction = event.target.closest("[data-payment-action]");
  if (paymentAction) {
    const state = data();
    const payment = state.payments.find((item) => item.id === paymentAction.dataset.payment);
    if (paymentAction.dataset.paymentAction === "refund") payment.status = "refunded";
    if (paymentAction.dataset.paymentAction === "overdue") payment.status = "overdue";
    save(state);
    toast("支付记录已更新");
    renderAdmin();
  }

  const switchTarget = event.target.closest("[data-switch-module]");
  if (switchTarget) {
    activeModule = switchTarget.dataset.switchModule;
    selectedId = switchTarget.dataset.select;
    document.querySelectorAll("[data-admin]").forEach((item) => item.classList.toggle("active", item.dataset.admin === activeModule));
    renderAdmin();
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-form]");
  if (!form) return;
  event.preventDefault();
  const formData = new FormData(form);
  if (form.dataset.form === "vehicle") updateModel(formData, form.dataset.id);
  if (form.dataset.form === "plan") updatePlan(formData, form.dataset.id);
  if (form.dataset.form === "order-note") {
    const state = data();
    orderOf(state, form.dataset.id).note = formData.get("note");
    save(state);
  }
  toast("二级页面内容已保存");
  renderAdmin();
});

document.querySelector("#adminSearch").addEventListener("input", (event) => {
  query = event.target.value.trim();
  selectedId = "";
  renderTable();
  renderDetail();
});

document.querySelector("#adminStatusFilter").addEventListener("change", (event) => {
  statusFilter = event.target.value;
  selectedId = "";
  renderTable();
  renderDetail();
});

document.querySelector("#adminPrimaryAction").addEventListener("click", handlePrimaryAction);

document.querySelector("#logoutButton").addEventListener("click", () => {
  AppStore.logout();
  location.href = "./admin-login.html";
});

document.querySelector("#resetDataButton").addEventListener("click", () => {
  AppStore.resetDemoData();
  selectedId = "";
  toast("演示数据已重置");
  renderAdmin();
});

window.addEventListener("subscription-state-change", renderAdmin);
renderAdmin();
