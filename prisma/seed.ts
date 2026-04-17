import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding LITE Platform database...");

  // ============================================================
  // USERS
  // ============================================================
  const adminPassword = await bcrypt.hash("LiteAdmin2026!", 12);
  const vendorPassword = await bcrypt.hash("VendorPass2026!", 12);

  const adminUser = await prisma.user.create({
    data: {
      email: "syenel@lordandtaylor.com",
      passwordHash: adminPassword,
      firstName: "Sina",
      lastName: "Yenel",
      role: "RETAILER_LT",
    },
  });

  const opsUser = await prisma.user.create({
    data: {
      email: "ops@lordandtaylor.com",
      passwordHash: adminPassword,
      firstName: "Operations",
      lastName: "Team",
      role: "RETAILER_LT",
    },
  });

  const financeUser = await prisma.user.create({
    data: {
      email: "jay@lordandtaylor.com",
      passwordHash: adminPassword,
      firstName: "Jay",
      lastName: "Finance",
      role: "RETAILER_LT",
    },
  });

  console.log("✅ Users created");

  // ============================================================
  // VENDORS (12 vendors from the live platform)
  // ============================================================
  const vendors = await Promise.all([
    prisma.vendor.create({
      data: {
        name: "Julian",
        slug: "julian",
        economicModel: "MARKETPLACE",
        location: "INTERNATIONAL",
        country: "IT",
        city: "Milan",
        integrationType: "SHOPIFY",
        brandStructure: "MULTI_BRAND",
        currency: "EUR",
        shippingModel: "DTC_B",
        commissionRate: 25.0,
        payoutCycle: "NET_30",
        contactEmail: "info@julianfashion.com",
        logoUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100",
        isActive: true,
        onboardedAt: new Date("2025-11-01"),
      },
    }),
    prisma.vendor.create({
      data: {
        name: "Tessabit",
        slug: "tessabit",
        economicModel: "MARKETPLACE",
        location: "INTERNATIONAL",
        country: "IT",
        city: "Como",
        integrationType: "SHOPIFY",
        brandStructure: "MULTI_BRAND",
        currency: "EUR",
        shippingModel: "DTC_B",
        commissionRate: 22.0,
        payoutCycle: "NET_30",
        contactEmail: "wholesale@tessabit.com",
        logoUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=100",
        isActive: true,
        onboardedAt: new Date("2025-10-15"),
      },
    }),
    prisma.vendor.create({
      data: {
        name: "Leam",
        slug: "leam",
        economicModel: "MARKETPLACE",
        location: "INTERNATIONAL",
        country: "IT",
        city: "Rome",
        integrationType: "API",
        brandStructure: "MULTI_BRAND",
        currency: "EUR",
        shippingModel: "DTC_B",
        commissionRate: 20.0,
        payoutCycle: "NET_14",
        contactEmail: "b2b@leamroma.com",
        logoUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=100",
        isActive: true,
        onboardedAt: new Date("2025-12-01"),
      },
    }),
    prisma.vendor.create({
      data: {
        name: "Spinnaker",
        slug: "spinnaker",
        economicModel: "MARKETPLACE",
        location: "INTERNATIONAL",
        country: "IT",
        city: "Sanremo",
        integrationType: "SHOPIFY",
        brandStructure: "MULTI_BRAND",
        currency: "EUR",
        shippingModel: "DTC_B",
        commissionRate: 23.0,
        payoutCycle: "NET_30",
        contactEmail: "info@spinnaker.it",
        logoUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=100",
        isActive: true,
        onboardedAt: new Date("2025-11-15"),
      },
    }),
    prisma.vendor.create({
      data: {
        name: "Coltorti",
        slug: "coltorti",
        economicModel: "MARKETPLACE",
        location: "INTERNATIONAL",
        country: "IT",
        city: "Jesi",
        integrationType: "SHOPIFY",
        brandStructure: "MULTI_BRAND",
        currency: "EUR",
        shippingModel: "DTC_B",
        commissionRate: 22.0,
        payoutCycle: "NET_30",
        contactEmail: "wholesale@coltorti.com",
        logoUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=100",
        isActive: true,
        onboardedAt: new Date("2026-01-10"),
      },
    }),
    prisma.vendor.create({
      data: {
        name: "Luxclusif",
        slug: "luxclusif",
        economicModel: "WHOLESALE",
        location: "INTERNATIONAL",
        country: "PT",
        city: "Porto",
        integrationType: "API",
        brandStructure: "MULTI_BRAND",
        currency: "EUR",
        shippingModel: "B2B_B",
        commissionRate: null,
        payoutCycle: "NET_14",
        contactEmail: "partners@luxclusif.com",
        logoUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=100",
        isActive: true,
        onboardedAt: new Date("2026-01-20"),
      },
    }),
    prisma.vendor.create({
      data: {
        name: "BRG Dresscode",
        slug: "brg-dresscode",
        economicModel: "WHOLESALE",
        location: "INTERNATIONAL",
        country: "NL",
        city: "Amsterdam",
        integrationType: "API",
        brandStructure: "MULTI_BRAND",
        currency: "EUR",
        shippingModel: "B2B_B",
        commissionRate: null,
        payoutCycle: "NET_30",
        contactEmail: "info@brgdresscode.com",
        logoUrl: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=100",
        isActive: true,
        onboardedAt: new Date("2026-02-01"),
      },
    }),
    prisma.vendor.create({
      data: {
        name: "Urban Threads",
        slug: "urban-threads",
        economicModel: "MARKETPLACE",
        location: "DOMESTIC_US",
        country: "US",
        city: "New York",
        integrationType: "SHOPIFY",
        brandStructure: "UNI_BRAND",
        currency: "USD",
        shippingModel: "DTC_A",
        commissionRate: 18.0,
        payoutCycle: "NET_14",
        contactEmail: "wholesale@urbanthreads.com",
        logoUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100",
        isActive: true,
        onboardedAt: new Date("2025-09-01"),
      },
    }),
    prisma.vendor.create({
      data: {
        name: "Gaudenzi",
        slug: "gaudenzi",
        economicModel: "MARKETPLACE",
        location: "INTERNATIONAL",
        country: "IT",
        city: "Rimini",
        integrationType: "SHOPIFY",
        brandStructure: "MULTI_BRAND",
        currency: "EUR",
        shippingModel: "DTC_B",
        commissionRate: 24.0,
        payoutCycle: "NET_30",
        contactEmail: "info@gaudenzi.com",
        logoUrl: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=100",
        isActive: true,
        onboardedAt: new Date("2026-02-15"),
      },
    }),
    prisma.vendor.create({
      data: {
        name: "Modes",
        slug: "modes",
        economicModel: "MARKETPLACE",
        location: "INTERNATIONAL",
        country: "IT",
        city: "Cagliari",
        integrationType: "SHOPIFY",
        brandStructure: "MULTI_BRAND",
        currency: "EUR",
        shippingModel: "DTC_B",
        commissionRate: 21.0,
        payoutCycle: "NET_14",
        contactEmail: "wholesale@modesportofino.com",
        logoUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=100",
        isActive: true,
        onboardedAt: new Date("2026-03-01"),
      },
    }),
    prisma.vendor.create({
      data: {
        name: "Link2Lux",
        slug: "link2lux",
        economicModel: "WHOLESALE",
        location: "INTERNATIONAL",
        country: "ES",
        city: "Madrid",
        integrationType: "API",
        brandStructure: "MULTI_BRAND",
        currency: "EUR",
        shippingModel: "B2B_B",
        commissionRate: null,
        payoutCycle: "NET_30",
        contactEmail: "partners@link2lux.com",
        logoUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=100",
        isActive: true,
        onboardedAt: new Date("2026-03-10"),
      },
    }),
    prisma.vendor.create({
      data: {
        name: "Deliberti",
        slug: "deliberti",
        economicModel: "MARKETPLACE",
        location: "INTERNATIONAL",
        country: "IT",
        city: "Naples",
        integrationType: "SHOPIFY",
        brandStructure: "MULTI_BRAND",
        currency: "EUR",
        shippingModel: "DTC_B",
        commissionRate: 20.0,
        payoutCycle: "NET_30",
        contactEmail: "info@deliberti.it",
        logoUrl: "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=100",
        isActive: true,
        onboardedAt: new Date("2026-03-15"),
      },
    }),
  ]);

  console.log(`✅ ${vendors.length} vendors created`);

  // Create vendor users with VendorAccess
  // Portal-only vendors (PORTAL type): Link2Lux, Luxclusif, BRG Dresscode
  const portalOnlyVendors = new Set(["link2lux", "luxclusif", "brg-dresscode"]);

  for (const vendor of vendors) {
    const isPortalOnly = portalOnlyVendors.has(vendor.slug);
    const user = await prisma.user.create({
      data: {
        email: `vendor@${vendor.slug}.com`,
        passwordHash: vendorPassword,
        firstName: vendor.name,
        lastName: "Admin",
        role: isPortalOnly ? "VENDOR" : "VENDOR_USER",
        vendorId: vendor.id,
      },
    });

    // Create VendorAccess record
    await prisma.vendorAccess.create({
      data: {
        userId: user.id,
        vendorId: vendor.id,
        portalType: isPortalOnly ? "PORTAL" : "FULL",
        shipFromAddress: {
          street: `${vendor.name} Warehouse`,
          city: vendor.city || "Unknown",
          country: vendor.country,
        },
      },
    });
  }

  console.log("✅ Vendor users and access records created");

  // ============================================================
  // PRODUCTS (sample products per vendor)
  // ============================================================
  const brands = [
    "Gucci", "Prada", "Valentino", "Balenciaga", "Bottega Veneta",
    "Saint Laurent", "Burberry", "Givenchy", "Fendi", "Versace",
    "Dolce & Gabbana", "Moncler", "Alexander McQueen", "Off-White",
    "Maison Margiela", "Loewe", "Celine", "Dior", "Chanel", "Hermès",
  ];

  const categories = [
    "Dresses", "Tops", "Pants", "Outerwear", "Knitwear",
    "Handbags", "Shoes", "Accessories", "Jewelry", "Sunglasses",
  ];

  const productTypes = [
    "Midi Dress", "Mini Dress", "Maxi Dress", "Silk Blouse", "Cashmere Sweater",
    "Ankle Boots", "Pumps", "Sneakers", "Scarf", "Belt",
    "Earrings", "Necklace", "Aviator Sunglasses", "Cat-Eye Sunglasses",
    "Trench Coat", "Blazer", "Wide-Leg Pants",
  ];

  const sizes = ["XS", "S", "M", "L", "XL"];
  const colors = ["Black", "White", "Navy", "Beige", "Red", "Burgundy", "Olive", "Camel"];
  const statuses: Array<"PUSHED" | "APPROVED" | "PENDING_REVIEW" | "QUALIFIED" | "NEEDS_REVIEW"> = [
    "PUSHED", "PUSHED", "PUSHED", "PUSHED", "APPROVED", "PENDING_REVIEW", "QUALIFIED", "NEEDS_REVIEW",
  ];

  const imageUrls = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
    "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400",
    "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400",
    "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400",
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400",
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400",
  ];

  let productCount = 0;
  const allProducts: any[] = [];

  for (const vendor of vendors) {
    const numProducts = 15 + Math.floor(Math.random() * 25);
    for (let i = 0; i < numProducts; i++) {
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const type = productTypes[Math.floor(Math.random() * productTypes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const basePrice = 200 + Math.floor(Math.random() * 2800);
      const commRate = vendor.commissionRate || 0;
      const enrichScore = 30 + Math.floor(Math.random() * 70);

      const product = await prisma.product.create({
        data: {
          vendorId: vendor.id,
          title: `${brand} ${color} ${type}`,
          description: `Luxurious ${color.toLowerCase()} ${type.toLowerCase()} by ${brand}. Crafted with exceptional attention to detail.`,
          productType: type,
          category,
          brand,
          tags: [brand.toLowerCase(), category.toLowerCase(), color.toLowerCase(), vendor.slug],
          status,
          compareAtPrice: basePrice * 1.2,
          salesPrice: basePrice,
          retailerCost: basePrice * (1 - commRate / 100),
          vendorCost: vendor.economicModel === "WHOLESALE" ? basePrice * 0.5 : null,
          currency: vendor.currency,
          enrichmentScore: enrichScore,
          attributeScore: Math.floor(enrichScore * 0.25),
          descriptionScore: Math.floor(enrichScore * 0.35),
          seoScore: Math.floor(enrichScore * 0.25),
          geoScore: Math.floor(enrichScore * 0.15),
          shipsFrom: vendor.country === "IT" ? "Italy" : vendor.country === "ES" ? "Spain" : vendor.country === "NL" ? "Netherlands" : vendor.country === "PT" ? "Portugal" : "USA",
          countryOfOrigin: vendor.country,
          publishedAt: status === "PUSHED" ? new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) : null,
        },
      });

      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imageUrls[Math.floor(Math.random() * imageUrls.length)],
          position: 0,
        },
      });

      const numVariants = 3 + Math.floor(Math.random() * 3);
      for (let v = 0; v < numVariants; v++) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            title: `${sizes[v % sizes.length]} / ${color}`,
            size: sizes[v % sizes.length],
            color,
            salesPrice: basePrice,
            retailerCost: basePrice * (1 - commRate / 100),
            inventoryQuantity: Math.floor(Math.random() * 10) + 1,
          },
        });
      }

      allProducts.push(product);
      productCount++;
    }
  }

  console.log(`✅ ${productCount} products created with variants and images`);

  // ============================================================
  // ORDERS — Now using MarketplaceOrder + VendorOrder
  // ============================================================
  const customerNames = [
    "Sarah Johnson", "Michael Chen", "Emily Rodriguez", "James Wilson",
    "Amanda Thompson", "David Kim", "Jessica Martinez", "Robert Taylor",
    "Jennifer Brown", "Christopher Lee", "Ashley Davis", "Matthew Garcia",
    "Sophia Anderson", "Daniel Thomas", "Olivia Jackson", "Andrew White",
  ];

  const orderStatuses: OrderStatus[] = [
    "PLACED", "VENDOR_ACCEPT", "SHIPPED", "IN_TRANSIT", "DELIVERED",
    "DELIVERED", "DELIVERED", "IN_TRANSIT", "SHIPPED", "SETTLED",
  ];

  type OrderStatus = "PLACED" | "SPLIT" | "VENDOR_ACCEPT" | "FRAUD_HOLD" | "VENDOR_REJECTED" | "GENERATE_LABEL" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "SETTLED" | "CANCELLED" | "RETURN_INITIATED" | "RETURN_RECEIVED" | "RETURN_COMPLETED";

  let orderCount = 0;

  for (let i = 0; i < 150; i++) {
    const customer = customerNames[Math.floor(Math.random() * customerNames.length)];
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const daysAgo = Math.floor(Math.random() * 90);
    const placedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const numVendors = 1 + Math.floor(Math.random() * 2);
    const orderVendors = [...vendors].sort(() => Math.random() - 0.5).slice(0, numVendors);
    let totalAmount = 0;

    // MarketplaceOrder (maps to "Order" table)
    const order = await prisma.marketplaceOrder.create({
      data: {
        orderNumber: `LT-${String(7800 + i).padStart(6, "0")}`,
        shopifyOrderId: `${5000000000 + i}`,
        customerEmail: `${customer.toLowerCase().replace(" ", ".")}@email.com`,
        customerName: customer,
        totalAmount: 0,
        status,
        paymentStatus: "paid",
        placedAt,
        shippingAddress: {
          line1: `${100 + Math.floor(Math.random() * 900)} Main St`,
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "US",
        },
      },
    });

    for (const vendor of orderVendors) {
      const vendorProducts = allProducts.filter((p) => p.vendorId === vendor.id);
      if (vendorProducts.length === 0) continue;

      const numItems = 1 + Math.floor(Math.random() * 3);
      const selectedProducts = [...vendorProducts]
        .sort(() => Math.random() - 0.5)
        .slice(0, numItems);

      let subtotal = 0;
      // VendorOrder (maps to "SubOrder" table)
      const vendorOrder = await prisma.vendorOrder.create({
        data: {
          orderId: order.id,
          vendorId: vendor.id,
          status,
          subtotal: 0,
          commissionRate: vendor.commissionRate,
          currency: "USD",
          acceptedAt: ["VENDOR_ACCEPT", "SHIPPED", "IN_TRANSIT", "DELIVERED", "SETTLED"].includes(status)
            ? new Date(placedAt.getTime() + 12 * 60 * 60 * 1000)
            : null,
          shippedAt: ["SHIPPED", "IN_TRANSIT", "DELIVERED", "SETTLED"].includes(status)
            ? new Date(placedAt.getTime() + 36 * 60 * 60 * 1000)
            : null,
          deliveredAt: ["DELIVERED", "SETTLED"].includes(status)
            ? new Date(placedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
            : null,
          slaDeadline: new Date(placedAt.getTime() + 48 * 60 * 60 * 1000),
        },
      });

      for (const product of selectedProducts) {
        const qty = 1;
        const price = product.salesPrice || 500;
        subtotal += price * qty;

        await prisma.orderItem.create({
          data: {
            vendorOrderId: vendorOrder.id,
            productId: product.id,
            quantity: qty,
            unitPrice: price,
            totalPrice: price * qty,
            retailerCost: product.retailerCost,
            vendorCost: product.vendorCost,
          },
        });
      }

      const commission = vendor.commissionRate ? subtotal * (vendor.commissionRate / 100) : 0;
      await prisma.vendorOrder.update({
        where: { id: vendorOrder.id },
        data: {
          subtotal,
          commission,
          vendorEarnings: subtotal - commission,
        },
      });

      totalAmount += subtotal;

      // Create shipment for shipped orders
      if (["SHIPPED", "IN_TRANSIT", "DELIVERED", "SETTLED"].includes(status)) {
        const carriers: Array<"FEDEX" | "DHL" | "UPS"> = ["FEDEX", "DHL", "UPS"];
        const shipmentStatus = status === "SHIPPED" ? "PICKED_UP" as const :
          status === "IN_TRANSIT" ? "IN_TRANSIT" as const :
          "DELIVERED" as const;

        await prisma.shipment.create({
          data: {
            vendorOrderId: vendorOrder.id,
            vendorId: vendor.id,
            shippingModel: vendor.shippingModel,
            carrier: carriers[Math.floor(Math.random() * carriers.length)],
            leg: vendor.shippingModel.startsWith("B2B") ? "LEG_1" : "DIRECT",
            status: shipmentStatus,
            trackingNumber: `${Math.floor(Math.random() * 900000000000) + 100000000000}`,
            shippingCost: 15 + Math.floor(Math.random() * 85),
            costCurrency: "USD",
            estimatedDelivery: new Date(placedAt.getTime() + 10 * 24 * 60 * 60 * 1000),
            actualDelivery: shipmentStatus === "DELIVERED"
              ? new Date(placedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
              : null,
          },
        });
      }

      // Create settlement for settled orders
      if (status === "SETTLED") {
        await prisma.settlement.create({
          data: {
            vendorId: vendor.id,
            vendorOrderId: vendorOrder.id,
            amount: subtotal - commission,
            currency: vendor.currency,
            status: "COMPLETED",
            processorRef: `REV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            completedAt: new Date(placedAt.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    await prisma.marketplaceOrder.update({
      where: { id: order.id },
      data: { totalAmount },
    });

    orderCount++;
  }

  console.log(`✅ ${orderCount} orders created with vendor orders, items, shipments, and settlements`);

  // ============================================================
  // RETURNS
  // ============================================================
  const deliveredVendorOrders = await prisma.vendorOrder.findMany({
    where: { status: "DELIVERED" },
    take: 25,
    include: { order: true },
  });

  const returnStatuses: Array<"INITIATED" | "IN_TRANSIT" | "RECEIVED_WAREHOUSE" | "INSPECTING" | "APPROVED" | "REFUNDED"> = [
    "INITIATED", "IN_TRANSIT", "RECEIVED_WAREHOUSE", "INSPECTING", "APPROVED", "REFUNDED",
  ];

  for (const vo of deliveredVendorOrders) {
    const retStatus = returnStatuses[Math.floor(Math.random() * returnStatuses.length)];
    await prisma.return.create({
      data: {
        vendorOrderId: vo.id,
        vendorId: vo.vendorId,
        status: retStatus,
        reason: ["Size too small", "Color different from photos", "Quality not as expected", "Changed mind", "Damaged in transit"][Math.floor(Math.random() * 5)],
        refundAmount: retStatus === "REFUNDED" ? vo.subtotal : null,
        initiatedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        receivedAt: ["RECEIVED_WAREHOUSE", "INSPECTING", "APPROVED", "REFUNDED"].includes(retStatus) ? new Date() : null,
      },
    });
  }

  console.log(`✅ ${deliveredVendorOrders.length} returns created`);

  // ============================================================
  // PAYOUTS
  // ============================================================
  for (const vendor of vendors) {
    const payoutStatuses: Array<"PENDING" | "COMPLETED" | "PROCESSING"> = ["PENDING", "COMPLETED", "COMPLETED", "PROCESSING"];
    for (let p = 0; p < 3; p++) {
      await prisma.payout.create({
        data: {
          vendorId: vendor.id,
          amount: 1000 + Math.floor(Math.random() * 15000),
          currency: vendor.currency,
          status: payoutStatuses[Math.floor(Math.random() * payoutStatuses.length)],
          payoutCycle: vendor.payoutCycle,
          processedAt: p > 0 ? new Date(Date.now() - p * 14 * 24 * 60 * 60 * 1000) : null,
        },
      });
    }
  }

  console.log("✅ Payouts created");

  // ============================================================
  // MESSAGE THREADS
  // ============================================================
  const departments: Array<"OPS" | "RMS" | "CX" | "CATALOG_BUYER"> = ["OPS", "RMS", "CX", "CATALOG_BUYER"];
  const priorities: Array<"LOW" | "NORMAL" | "HIGH" | "URGENT"> = ["LOW", "NORMAL", "HIGH", "URGENT"];
  const msgStatuses: Array<"OPEN" | "PENDING" | "RESOLVED"> = ["OPEN", "PENDING", "RESOLVED"];

  const subjects = [
    "Missing tracking information",
    "Product image quality issue",
    "Price discrepancy on order",
    "Shipping delay notification",
    "Return inspection required",
    "Commission rate adjustment request",
    "Inventory sync failure",
    "HS code classification needed",
    "Packing slip error",
    "Label generation failed",
  ];

  for (let t = 0; t < 30; t++) {
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    const thread = await prisma.messageThread.create({
      data: {
        vendorId: vendor.id,
        subject: subjects[Math.floor(Math.random() * subjects.length)],
        department: departments[Math.floor(Math.random() * departments.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: msgStatuses[Math.floor(Math.random() * msgStatuses.length)],
        assignedToId: [adminUser.id, opsUser.id, financeUser.id][Math.floor(Math.random() * 3)],
        slaDeadline: new Date(Date.now() + (Math.random() > 0.3 ? 1 : -1) * 24 * 60 * 60 * 1000),
      },
    });

    const numMessages = 1 + Math.floor(Math.random() * 4);
    for (let m = 0; m < numMessages; m++) {
      await prisma.message.create({
        data: {
          threadId: thread.id,
          senderId: m % 2 === 0 ? adminUser.id : opsUser.id,
          content: `Message ${m + 1} regarding ${thread.subject}. This is a sample message for development purposes.`,
          isInternal: Math.random() > 0.8,
          createdAt: new Date(Date.now() - (numMessages - m) * 2 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log("✅ Message threads created");

  // ============================================================
  // VENDOR PERFORMANCE METRICS
  // ============================================================
  for (const vendor of vendors) {
    for (let m = 0; m < 6; m++) {
      const date = new Date();
      date.setMonth(date.getMonth() - m);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      await prisma.vendorPerformance.create({
        data: {
          vendorId: vendor.id,
          period,
          fulfillmentRate: 85 + Math.random() * 15,
          acceptanceRate: 90 + Math.random() * 10,
          slaComplianceRate: 80 + Math.random() * 20,
          returnRate: Math.random() * 12,
          avgShipTime: 12 + Math.random() * 36,
          totalOrders: Math.floor(50 + Math.random() * 200),
          totalRevenue: 10000 + Math.random() * 90000,
          totalCommission: 2000 + Math.random() * 20000,
        },
      });
    }
  }

  console.log("✅ Vendor performance metrics created");

  // ============================================================
  // VENDOR ONBOARDING STEPS
  // ============================================================
  const onboardingSteps = [
    "contract_signed",
    "bank_details",
    "shipping_config",
    "catalog_uploaded",
    "test_order_completed",
    "go_live",
  ];

  for (const vendor of vendors) {
    for (const step of onboardingSteps) {
      await prisma.vendorOnboardingStep.create({
        data: {
          vendorId: vendor.id,
          stepName: step,
          status: vendor.onboardedAt ? "COMPLETED" : "PENDING",
          completedAt: vendor.onboardedAt || null,
        },
      });
    }
  }

  console.log("✅ Vendor onboarding steps created");

  console.log("\n🎉 Seed complete! LITE Platform database is ready.");
  console.log(`
  📊 Summary:
  - ${vendors.length} vendors
  - ${productCount} products
  - ${orderCount} marketplace orders
  - ${deliveredVendorOrders.length} returns
  - 30 message threads
  - 3 admin users + ${vendors.length} vendor users
  - ${vendors.length} vendor access records
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
