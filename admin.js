if (!AppStore.isLoggedIn()) {
  location.replace("./admin-login.html");
}

let activeModule = "vehicles";

function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.adminToastTimer);
  window.adminToastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

function statusLabel(value) {
  const map = {
    available: "可订",
    review: "需审核",
    docs_pending: "资料待上传",
    reviewing: "审核中",
    approved: "审核通过",
    rejected: "已拒绝",
    contract_pending: "待签约",
    delivery_pending: "待交付",
    delivered: "已交付",
    pending: "待处理",
    paid: "已支付",
    signed: "已签署",
    not_created: "未生成",
    uncreated: "未创建"
  };
  return map[value] || value || "-";
}

function row(cells, actions = "") {
  return { cells, actions };
}

function buildModule(name) {
  const data = AppStore.load();
  const orders = data.orders;
  const paid = data.payments.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0);
  const pendingPay = data.payments.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.amount, 0);
  const conversion = orders.length ? Math.round((orders.filter((item) => item.confirmed).length / orders.length) * 1000) / 10 : 0;
  const modules = {
    vehicles: {
      title: "车辆管理",
      subtitle: "管理车型、车架号、库存和状态，前端车型列表实时读取这里的数据。",
      kpis: [["车型数量", data.models.length], ["可订库存", data.models.reduce((sum, item) => sum + item.stock, 0)], ["现车车型", data.models.filter((item) => item.status === "available").length]],
      columns: ["车型", "车架号前缀", "库存城市", "库存", "状态"],
      rows: data.models.map((model) => row([model.name, `${model.vinPrefix}******`, model.city, `${model.stock} 台`, statusLabel(model.status)]))
    },
    pricing: {
      title: "价格管理",
      subtitle: "管理月租、押金、周期和优惠系数，前端方案价格实时计算。",
      kpis: [["方案数量", data.plans.length], ["最低月租", AppStore.money(Math.min(...data.models.map((item) => item.monthlyRent)))], ["优惠周期", `${data.plans.find((item) => item.discount < 1)?.months || 0} 个月`]],
      columns: ["方案", "周期", "优惠系数", "最低参考月租", "权益"],
      rows: data.plans.map((plan) => row([plan.name, `${plan.months} 个月`, plan.discount, AppStore.money(Math.round(data.models[0].monthlyRent * plan.discount)), plan.perks[0]]))
    },
    orders: {
      title: "订单管理",
      subtitle: "处理申请、审核、签约、交付和退订等订单阶段。",
      kpis: [["订单总数", orders.length], ["待审核", orders.filter((item) => item.status === "reviewing").length], ["待交付", orders.filter((item) => item.status === "delivery_pending").length]],
      columns: ["订单号", "客户", "车型", "阶段", "操作"],
      rows: orders.map((order) => {
        const model = AppStore.getModel(data, order.modelId);
        return row([order.id, order.customerName, model.name, AppStore.orderStage(order)], orderActions(order));
      })
    },
    customers: {
      title: "客户管理",
      subtitle: "查看身份信息、驾驶证和风控资料状态。",
      kpis: [["客户数量", data.users.length], ["实名通过", data.users.filter((item) => item.identityStatus === "verified").length], ["黑名单", data.blacklist.length]],
      columns: ["客户", "手机号", "身份信息", "驾驶证", "风控资料"],
      rows: data.users.map((user) => row([user.name, user.phone, statusLabel(user.identityStatus), statusLabel(user.licenseStatus), statusLabel(user.riskStatus)]))
    },
    contracts: {
      title: "合同管理",
      subtitle: "合同模板、电子签和下载状态来自客户订单签署结果。",
      kpis: [["合同数量", data.contracts.length], ["待电子签", data.contracts.filter((item) => item.status !== "signed").length], ["已签署", data.contracts.filter((item) => item.status === "signed").length]],
      columns: ["合同编号", "订单号", "模板", "电子签", "签署时间"],
      rows: data.contracts.map((contract) => row([contract.id, contract.orderId, contract.template, statusLabel(contract.status), contract.signedAt || "-"]))
    },
    payments: {
      title: "支付管理",
      subtitle: "真实支付接口未接入，后台可确认模拟账单支付状态。",
      kpis: [["已收金额", AppStore.money(paid)], ["待收金额", AppStore.money(pendingPay)], ["账单数量", data.payments.length]],
      columns: ["流水号", "订单号", "类型", "金额", "状态", "操作"],
      rows: data.payments.map((payment) => row([payment.id, payment.orderId, payment.type, AppStore.money(payment.amount), statusLabel(payment.status)], payment.status === "pending" ? `<button class="secondary-button compact-button" data-action="mark-paid" data-order="${payment.orderId}">确认支付</button>` : ""))
    },
    risk: {
      title: "风控审核",
      subtitle: "人工审核、黑名单和资料校验影响客户签约资格。",
      kpis: [["人工审核", orders.filter((item) => item.status === "reviewing").length], ["黑名单命中", orders.filter((item) => data.blacklist.includes(item.phone)).length], ["资料提交", orders.filter((item) => item.docs?.submitted).length]],
      columns: ["订单号", "客户", "资料", "风险等级", "处理状态"],
      rows: orders.map((order) => row([order.id, order.customerName, order.docs?.submitted ? "已提交" : "未提交", data.blacklist.includes(order.phone) ? "高" : "低", statusLabel(order.status)]))
    },
    analytics: {
      title: "运营数据",
      subtitle: "转化率、库存周转和逾期率由模拟业务数据实时汇总。",
      kpis: [["转化率", `${conversion}%`], ["库存周转", "42 天"], ["逾期率", "1.9%"]],
      columns: ["指标", "本期", "口径", "说明"],
      rows: [
        row(["访问到申请转化率", `${conversion}%`, "确认订单/申请订单", "由客户前端订单实时计算"]),
        row(["库存总量", data.models.reduce((sum, item) => sum + item.stock, 0), "全部车型", "车辆管理数据汇总"]),
        row(["待签合同", data.contracts.filter((item) => item.status !== "signed").length, "合同管理", "客户签署后自动减少"])
      ]
    }
  };
  return modules[name];
}

function orderActions(order) {
  const actions = [];
  if (order.status === "reviewing") {
    actions.push(`<button class="secondary-button compact-button" data-action="approve" data-order="${order.id}">审核通过</button>`);
    actions.push(`<button class="secondary-button compact-button danger-action" data-action="reject" data-order="${order.id}">拒绝</button>`);
  }
  if (order.contractStatus === "signed" && order.deliveryStatus !== "delivered") {
    actions.push(`<button class="secondary-button compact-button" data-action="deliver" data-order="${order.id}">确认交付</button>`);
  }
  return actions.join("");
}

function renderAdmin() {
  const module = buildModule(activeModule);
  document.querySelector("#adminTitle").textContent = module.title;
  document.querySelector("#adminSubtitle").textContent = module.subtitle;
  document.querySelector("#adminKpis").innerHTML = module.kpis
    .map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
  document.querySelector("#adminTableHead").innerHTML = `<tr>${module.columns.map((column) => `<th>${column}</th>`).join("")}</tr>`;
  document.querySelector("#adminTableBody").innerHTML = module.rows
    .map(
      (item) => `
        <tr>
          ${item.cells.map((cell, index) => `<td data-label="${module.columns[index]}">${index >= item.cells.length - 2 ? `<span class="status">${cell}</span>` : cell}</td>`).join("")}
          ${item.actions ? `<td data-label="操作" class="action-cell">${item.actions}</td>` : module.columns.includes("操作") ? `<td data-label="操作">-</td>` : ""}
        </tr>
      `
    )
    .join("");
}

document.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-admin]");
  if (tab) {
    activeModule = tab.dataset.admin;
    document.querySelectorAll("[data-admin]").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    renderAdmin();
  }

  const action = event.target.closest("[data-action]");
  if (action) {
    AppStore.adminUpdateOrder(action.dataset.order, action.dataset.action);
    toast("后台操作已保存，客户前端会同步更新");
    renderAdmin();
  }
});

document.querySelector("#logoutButton").addEventListener("click", () => {
  AppStore.logout();
  location.href = "./admin-login.html";
});

document.querySelector("#resetDataButton").addEventListener("click", () => {
  AppStore.resetDemoData();
  toast("演示数据已重置");
  renderAdmin();
});

window.addEventListener("subscription-state-change", renderAdmin);
renderAdmin();
