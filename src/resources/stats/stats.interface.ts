export interface StatsResult {
  // --- Super Admin Specific ---
  usersCount?: number;
  activeUsers?: number;
  marketsCount?: number;
  totalSnapshots?: number;      // Total historical price records
  recentPriceChanges?: number;  // Global updates in last 24h

  // --- Admin Specific ---
  productsCount?: number;       // Scoped to Admin's markets
  assignedMarkets?: number;     // Number of markets this admin manages
  totalProductsListed?: number; // Products created by this specific admin
  marketActivity?: number;      // Updates in admin's markets in last 24h

  // --- User Specific ---
  totalInventoryValue?: number; // Total NGN value of current stock
  inventoryItems?: number;      // Distinct products in inventory
  watchlistCount?: number;      // Number of followed products
  activeAlerts?: number;        // Number of active price triggers

  // --- General/Legacy ---
  totalMarkets?: number;
}