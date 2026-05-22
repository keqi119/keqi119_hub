(function () {
  const STORAGE_KEY = "subscription_platform_state_v3";
  const SESSION_KEY = "subscription_admin_session_v1";

  const seed = {
    currentUserId: "user-001",
    selectedModelId: "model-e",
    selectedPlanId: "plan-24",
    activeOrderId: "SO20260522001",
    models: [
      {
        id: "model-e",
        name: "Model E 城市版",
        type: ["ev", "sedan", "available"],
        monthlyRent: 4280,
        deposit: 12000,
        range: "520 km",
        city: "上海",
        stock: 12,
        vinPrefix: "LSE",
        status: "available",
        paint: "#106bff",
        tags: ["纯电", "轿车", "1 天交付"],
        intro: "适合城市通勤和家庭日常出行，续航充足，配置均衡。"
      },
      {
        id: "voyage-suv",
        name: "Voyage SUV Pro",
        type: ["ev", "suv", "available"],
        monthlyRent: 5680,
        deposit: 18000,
        range: "610 km",
        city: "杭州",
        stock: 6,
        vinPrefix: "LSV",
        status: "available",
        paint: "#00a884",
        tags: ["纯电", "SUV", "大空间"],
        intro: "更高通过性和装载能力，适合家庭长途、露营和商务接待。"
      },
      {
        id: "lux-s",
        name: "Lux S 商务版",
        type: ["sedan"],
        monthlyRent: 7980,
        deposit: 28000,
        range: "燃油/混动",
        city: "北京",
        stock: 3,
        vinPrefix: "LSL",
        status: "review",
        paint: "#172033",
        tags: ["商务", "轿车", "司机服务可选"],
        intro: "面向商务接待与企业管理层用车，支持企业月结和专属交付。"
      },
      {
        id: "mini-go",
        name: "Mini Go 灵活版",
        type: ["ev", "available"],
        monthlyRent: 2680,
        deposit: 8000,
        range: "360 km",
        city: "广州",
        stock: 18,
        vinPrefix: "LSM",
        status: "available",
        paint: "#f59f00",
        tags: ["纯电", "短租优选", "低押金"],
        intro: "低成本灵活用车方案，适合个人短期通勤与门店员工代步。"
      }
    ],
    plans: [
      {
        id: "plan-12",
        name: "12 个月灵活订阅",
        months: 12,
        discount: 1.08,
        badge: "灵活",
        perks: ["每月 1,500 公里", "基础保险", "免费保养", "提前退订手续费 1 个月"]
      },
      {
        id: "plan-24",
        name: "24 个月标准订阅",
        months: 24,
        discount: 1,
        badge: "推荐",
        featured: true,
        perks: ["每月 2,000 公里", "基础保险 + 玻璃险", "免费保养", "可免费换车 1 次"]
      },
      {
        id: "plan-36",
        name: "36 个月长期订阅",
        months: 36,
        discount: 0.9,
        badge: "省心",
        perks: ["每月 2,500 公里", "全险服务包", "上门取送保养", "企业月结支持"]
      }
    ],
    users: [
      {
        id: "user-001",
        name: "陈女士",
        phone: "13800001234",
        identityStatus: "verified",
        licenseStatus: "verified",
        riskStatus: "approved"
      }
    ],
    orders: [
      {
        id: "SO20260522001",
        userId: "user-001",
        customerName: "陈女士",
        phone: "13800001234",
        modelId: "model-e",
        planId: "plan-24",
        city: "上海",
        startDate: "2026-06-01",
        note: "希望白色车辆，浦东交付。",
        status: "contract_pending",
        docs: {
          identity: "id-card-demo.pdf",
          license: "driver-license-demo.pdf",
          risk: "risk-info-demo.pdf",
          submitted: true,
          verified: true
        },
        confirmed: true,
        paymentStatus: "pending",
        contractStatus: "pending",
        deliveryStatus: "waiting",
        createdAt: "2026-05-22 10:30"
      }
    ],
    contracts: [
      {
        id: "CT20260522001",
        orderId: "SO20260522001",
        template: "个人标准版",
        status: "pending",
        signedAt: ""
      }
    ],
    payments: [
      {
        id: "PAY20260522001",
        orderId: "SO20260522001",
        type: "押金+首期月租",
        amount: 16280,
        status: "pending",
        channel: "未接入",
        dueDate: "2026-06-01"
      }
    ],
    blacklist: ["13999999999"]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return clone(seed);
    }
    try {
      return { ...clone(seed), ...JSON.parse(raw) };
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return clone(seed);
    }
  }

  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("subscription-state-change"));
  }

  function money(amount) {
    return `¥${Number(amount || 0).toLocaleString("zh-CN")}`;
  }

  function now() {
    return new Date().toLocaleString("zh-CN", { hour12: false });
  }

  function nextId(prefix, list) {
    const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const count = list.filter((item) => String(item.id).includes(today)).length + 1;
    return `${prefix}${today}${String(count).padStart(3, "0")}`;
  }

  function getModel(state, id) {
    return state.models.find((item) => item.id === id) || state.models[0];
  }

  function getPlan(state, id) {
    return state.plans.find((item) => item.id === id) || state.plans[1];
  }

  function monthlyRent(model, plan) {
    return Math.round(model.monthlyRent * plan.discount);
  }

  function orderTotal(state, order) {
    const model = getModel(state, order.modelId);
    const plan = getPlan(state, order.planId);
    return model.deposit + monthlyRent(model, plan);
  }

  function orderStage(order) {
    if (!order) return "暂无订单";
    if (order.deliveryStatus === "delivered") return "已交付";
    if (order.contractStatus === "signed") return "待交付";
    if (order.status === "contract_pending") return "待签约";
    if (order.status === "approved") return "待确认";
    if (order.docs?.submitted) return "审核中";
    return "资料待上传";
  }

  function createOrder(payload) {
    const state = load();
    const user = state.users.find((item) => item.id === state.currentUserId) || state.users[0];
    user.name = payload.name;
    user.phone = payload.phone;
    const order = {
      id: nextId("SO", state.orders),
      userId: user.id,
      customerName: payload.name,
      phone: payload.phone,
      modelId: payload.modelId,
      planId: payload.planId,
      city: payload.city,
      startDate: payload.startDate,
      note: payload.note || "",
      status: state.blacklist.includes(payload.phone) ? "rejected" : "docs_pending",
      docs: { identity: "", license: "", risk: "", submitted: false, verified: false },
      confirmed: false,
      paymentStatus: "uncreated",
      contractStatus: "not_created",
      deliveryStatus: "not_started",
      createdAt: now()
    };
    state.orders.unshift(order);
    state.activeOrderId = order.id;
    state.selectedModelId = payload.modelId;
    state.selectedPlanId = payload.planId;
    save(state);
    return order;
  }

  function updateDocs(orderId, docs) {
    const state = load();
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return null;
    order.docs = {
      identity: docs.identity || order.docs.identity,
      license: docs.license || order.docs.license,
      risk: docs.risk || order.docs.risk,
      submitted: true,
      verified: false
    };
    order.status = "reviewing";
    save(state);
    return order;
  }

  function confirmOrder(orderId) {
    const state = load();
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return null;
    order.confirmed = true;
    order.status = order.docs?.verified ? "contract_pending" : "reviewing";
    const existingContract = state.contracts.find((item) => item.orderId === order.id);
    if (!existingContract) {
      state.contracts.unshift({
        id: nextId("CT", state.contracts),
        orderId: order.id,
        template: "个人标准版",
        status: "pending",
        signedAt: ""
      });
    }
    save(state);
    return order;
  }

  function createPendingPayment(orderId) {
    const state = load();
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return null;
    order.paymentStatus = "pending";
    const existing = state.payments.find((item) => item.orderId === order.id);
    if (existing) {
      existing.amount = orderTotal(state, order);
      existing.status = "pending";
      existing.channel = "待接入";
    } else {
      state.payments.unshift({
        id: nextId("PAY", state.payments),
        orderId: order.id,
        type: "押金+首期月租",
        amount: orderTotal(state, order),
        status: "pending",
        channel: "待接入",
        dueDate: order.startDate
      });
    }
    save(state);
    return order;
  }

  function signContract(orderId) {
    const state = load();
    const order = state.orders.find((item) => item.id === orderId);
    const contract = state.contracts.find((item) => item.orderId === orderId);
    if (!order || !contract) return null;
    order.contractStatus = "signed";
    order.status = "delivery_pending";
    contract.status = "signed";
    contract.signedAt = now();
    save(state);
    return contract;
  }

  function adminUpdateOrder(orderId, action) {
    const state = load();
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return null;
    if (action === "approve") {
      order.docs.verified = true;
      order.status = order.confirmed ? "contract_pending" : "approved";
    }
    if (action === "reject") {
      order.status = "rejected";
      order.docs.verified = false;
    }
    if (action === "mark-paid") {
      order.paymentStatus = "paid";
      const payment = state.payments.find((item) => item.orderId === orderId);
      if (payment) {
        payment.status = "paid";
        payment.channel = "后台确认";
      }
    }
    if (action === "deliver") {
      order.deliveryStatus = "delivered";
      order.status = "delivered";
      const model = getModel(state, order.modelId);
      model.stock = Math.max(0, model.stock - 1);
    }
    save(state);
    return order;
  }

  function login(username, password) {
    if (username === "admin" && password === "Subscription2026") {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username, loginAt: now() }));
      return true;
    }
    return false;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function isLoggedIn() {
    return Boolean(sessionStorage.getItem(SESSION_KEY));
  }

  window.AppStore = {
    load,
    save,
    money,
    getModel,
    getPlan,
    monthlyRent,
    orderTotal,
    orderStage,
    createOrder,
    updateDocs,
    confirmOrder,
    createPendingPayment,
    signContract,
    adminUpdateOrder,
    login,
    logout,
    isLoggedIn,
    resetDemoData() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return load();
    }
  };
})();
