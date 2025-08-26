class Orders {
    constructor(orders = []) {
        this.orders = orders;
    }

    // Add a new order
    addOrder(order) {
        this.orders.push(order);
    }

    // Get all orders
    getAllOrders() {
        return this.orders;
    }

    // Find order by ID
    findOrderById(orderId) {
        return this.orders.find(order => order.orderId === orderId);
    }

    // Get orders by status
    getOrdersByStatus(status) {
        return this.orders.filter(order => order.status === status);
    }

    // Get orders by priority
    getOrdersByPriority(priority) {
        return this.orders.filter(order => order.priority === priority);
    }

    // Update order status
    updateOrderStatus(orderId, newStatus) {
        const order = this.findOrderById(orderId);
        if (order) {
            order.status = newStatus;
            return true;
        }
        return false;
    }

    // Remove order by ID
    removeOrder(orderId) {
        const index = this.orders.findIndex(order => order.orderId === orderId);
        if (index > -1) {
            return this.orders.splice(index, 1)[0];
        }
        return null;
    }

    // Get order count
    getOrderCount() {
        return this.orders.length;
    }

    // Get orders by customer
    getOrdersByCustomer(customer) {
        return this.orders.filter(order => order.customer === customer);
    }

    // Sort orders by due date
    sortByDueDate() {
        return this.orders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    // Get high priority orders
    getHighPriorityOrders() {
        return this.getOrdersByPriority("High");
    }
}

// Example usage:
const initialOrders = [
    {
        orderId: "ORD-12847",
        customer: "Acme Corp",
        email: "orders@acme.com",
        items: "25 items",
        total: "$2,847.50",
        status: "Processing",
    }
];

// Create instance
const orderManager = new Orders(initialOrders);

// Example operations
console.log("All orders:", orderManager.getAllOrders());
console.log("Order count:", orderManager.getOrderCount());

// Add a new order
orderManager.addOrder({
    orderId: "ORD-12848",
    customer: "Tech Solutions Inc",
    email: "orders@techsol.com",
    items: "12 items",
    total: "$1,250.00",
    status: "Completed"
});

// Find specific order
const foundOrder = orderManager.findOrderById("ORD-12847");
console.log("Found order:", foundOrder);

// Get orders by status
const processingOrders = orderManager.getOrdersByStatus("Processing");
console.log("Processing orders:", processingOrders);

// Update order status
orderManager.updateOrderStatus("ORD-12847", "Completed");
console.log("Updated order:", orderManager.findOrderById("ORD-12847"));

export default Orders;