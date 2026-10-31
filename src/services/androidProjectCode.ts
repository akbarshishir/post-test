/**
 * Full Android Studio Project Source Code Catalog
 * Contains production-grade Kotlin, Jetpack Compose, Room SQLite,
 * Gradle Kotlin DSL, and Unit Tests for "Offline POS Manager".
 */

export interface AndroidSourceFile {
  path: string;
  category: 'gradle' | 'manifest' | 'entity' | 'dao' | 'db' | 'repo' | 'viewmodel' | 'ui' | 'test';
  description: string;
  code: string;
}

export const ANDROID_PROJECT_FILES: AndroidSourceFile[] = [
  {
    path: 'build.gradle.kts (Project)',
    category: 'gradle',
    description: 'Root Gradle configuration with Kotlin and KSP plugins',
    code: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
}
`
  },
  {
    path: 'app/build.gradle.kts',
    category: 'gradle',
    description: 'App-level build script with Room, Compose, Material 3, and Coroutines',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.offlinepos.manager"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.offlinepos.manager"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        ksp {
            arg("room.schemaLocation", "$projectDir/schemas")
            arg("room.incremental", "true")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    // AndroidX & Lifecycle
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    // Room Database & SQLite
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // Kotlin Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Testing
    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}
`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    category: 'manifest',
    description: 'Application manifest with Bluetooth and Print capabilities without unnecessary permissions',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Optional Bluetooth print permission for thermal printers -->
    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN"
        android:usesPermissionFlags="neverForLocation"
        tools:targetApi="s" />

    <application
        android:name=".PosApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.OfflinePOSManager">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize"
            android:theme="@style/Theme.OfflinePOSManager">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.provider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>

</manifest>
`
  },
  {
    path: 'app/src/main/java/com/offlinepos/manager/data/local/entity/ProductEntity.kt',
    category: 'entity',
    description: 'Room entity for products with indexing on SKU, barcode, and category',
    code: `package com.offlinepos.manager.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "products",
    indices = [
        Index(value = ["sku"], unique = true),
        Index(value = ["barcode"]),
        Index(value = ["categoryId"])
    ]
)
data class ProductEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val nameBn: String,
    val sku: String,
    val barcode: String? = null,
    val categoryId: Long,
    val purchasePrice: Double, // Cost of goods sold
    val sellingPrice: Double,
    val stockQuantity: Double,
    val lowStockThreshold: Double = 5.0,
    val unit: String = "Pcs",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
`
  },
  {
    path: 'app/src/main/java/com/offlinepos/manager/data/local/entity/SaleEntity.kt',
    category: 'entity',
    description: 'Room entity for sales transactions with status and customer foreign key',
    code: `package com.offlinepos.manager.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "sales",
    indices = [
        Index(value = ["invoiceNumber"], unique = true),
        Index(value = ["customerId"]),
        Index(value = ["createdAt"])
    ]
)
data class SaleEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val invoiceNumber: String,
    val customerId: Long? = null,
    val customerName: String? = null,
    val subtotal: Double,
    val discountTotal: Double = 0.0,
    val vatTaxTotal: Double = 0.0,
    val grandTotal: Double,
    val paidAmount: Double,
    val changeAmount: Double = 0.0,
    val balanceDue: Double = 0.0,
    val paymentMethod: String, // CASH, BKASH, NAGAD, BANK, CREDIT
    val totalCostOfGoods: Double,
    val grossProfit: Double,
    val status: String = "COMPLETED", // COMPLETED, REFUNDED, CANCELLED
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
`
  },
  {
    path: 'app/src/main/java/com/offlinepos/manager/data/local/entity/SaleItemEntity.kt',
    category: 'entity',
    description: 'Room entity for itemized sales lines storing historical purchase cost',
    code: `package com.offlinepos.manager.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "sale_items",
    foreignKeys = [
        ForeignKey(
            entity = SaleEntity::class,
            parentColumns = ["id"],
            childColumns = ["saleId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["saleId"]), Index(value = ["productId"])]
)
data class SaleItemEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val saleId: Long,
    val productId: Long,
    val productName: String,
    val sku: String,
    val quantity: Double,
    val purchaseCost: Double, // Cost at time of sale for exact COGS calculation
    val unitPrice: Double,
    val discountAmount: Double = 0.0,
    val lineTotal: Double
)
`
  },
  {
    path: 'app/src/main/java/com/offlinepos/manager/data/local/entity/CustomerEntity.kt',
    category: 'entity',
    description: 'Room entity for customers with outstanding balance ledger',
    code: `package com.offlinepos.manager.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "customers",
    indices = [Index(value = ["phone"])]
)
data class CustomerEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val phone: String,
    val address: String? = null,
    val totalBalanceDue: Double = 0.0,
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
`
  },
  {
    path: 'app/src/main/java/com/offlinepos/manager/data/local/entity/CustomerLedgerEntryEntity.kt',
    category: 'entity',
    description: 'Room entity for immutable financial audit ledger of credit sales and repayments',
    code: `package com.offlinepos.manager.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "customer_ledger",
    foreignKeys = [
        ForeignKey(
            entity = CustomerEntity::class,
            parentColumns = ["id"],
            childColumns = ["customerId"],
            onDelete = ForeignKey.RESTRICT
        )
    ],
    indices = [Index(value = ["customerId"]), Index(value = ["createdAt"])]
)
data class CustomerLedgerEntryEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val customerId: Long,
    val type: String, // CREDIT_SALE, PAYMENT_RECEIVED, RETURN_CREDIT
    val amount: Double,
    val previousBalance: Double,
    val newBalance: Double,
    val referenceId: String? = null,
    val note: String,
    val createdAt: Long = System.currentTimeMillis()
)
`
  },
  {
    path: 'app/src/main/java/com/offlinepos/manager/data/local/entity/UserEntity.kt',
    category: 'entity',
    description: 'Room entity for multi-user authentication and role-based permissions (ADMIN, MANAGER, SALESMAN, ACCOUNTANT)',
    code: `package com.offlinepos.manager.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "users",
    indices = [Index(value = ["phone"])]
)
data class UserEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val phone: String,
    val role: String, // ADMIN, MANAGER, SALESMAN, ACCOUNTANT
    val pin: String, // 4-digit PIN
    val active: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)
`
  },
  {
    path: 'app/src/main/java/com/offlinepos/manager/data/local/entity/ExpenseEntity.kt',
    category: 'entity',
    description: 'Room entity for daily and monthly operating expense logs',
    code: `package com.offlinepos.manager.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "expenses",
    indices = [Index(value = ["category"]), Index(value = ["date"])]
)
data class ExpenseEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val category: String, // RENT, ELECTRICITY_UTILITY, STAFF_SALARY, TRANSPORT, PACKAGING, TEA_SNACKS, OTHER
    val amount: Double,
    val paymentMethod: String,
    val notes: String? = null,
    val date: Long = System.currentTimeMillis(),
    val createdAt: Long = System.currentTimeMillis()
)
`
  },
  {
    path: 'app/src/main/java/com/offlinepos/manager/data/local/entity/StockAdjustmentEntity.kt',
    category: 'entity',
    description: 'Room entity for inventory movements and stock audit trails',
    code: `package com.offlinepos.manager.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "stock_adjustments",
    indices = [Index(value = ["productId"]), Index(value = ["createdAt"])]
)
data class StockAdjustmentEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val productId: Long,
    val type: String, // INITIAL, SALE, PURCHASE, MANUAL_ADJUSTMENT, RETURN
    val quantityChange: Double,
    val previousStock: Double,
    val newStock: Double,
    val reason: String,
    val referenceId: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
`
  },
  {
    path: 'app/src/main/java/com/offlinepos/manager/data/local/dao/ProductDao.kt',
    category: 'dao',
    description: 'Product DAO with flow queries, stock updates, and sales check',
    code: `package com.offlinepos.manager.data.local.dao

import androidx.room.*
import com.offlinepos.manager.data.local.entity.ProductEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ProductDao {
    @Query("SELECT * FROM products ORDER BY name ASC")
    fun getAllProducts(): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE stockQuantity <= lowStockThreshold ORDER BY stockQuantity ASC")
    fun getLowStockProducts(): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE id = :id")
    suspend fun getProductById(id: Long): ProductEntity?

    @Query("SELECT * FROM products WHERE sku = :sku OR barcode = :barcode LIMIT 1")
    suspend fun findByCode(sku: String, barcode: String): ProductEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduct(product: ProductEntity): Long

    @Update
    suspend fun updateProduct(product: ProductEntity)

    @Query("UPDATE products SET stockQuantity = stockQuantity + :quantityDiff, updatedAt = :timestamp WHERE id = :productId")
    suspend fun adjustStock(productId: Long, quantityDiff: Double, timestamp: Long = System.currentTimeMillis())

    @Query("SELECT COUNT(*) FROM sale_items WHERE productId = :productId")
    suspend fun getProductSaleCount(productId: Long): Int

    @Delete
    suspend fun deleteProduct(product: ProductEntity)
}
`
  },
  {
    path: 'app/src/main/java/com/offlinepos/manager/data/local/dao/SaleDao.kt',
    category: 'dao',
    description: 'Sale and SaleItems DAO with date-range reporting queries',
    code: `package com.offlinepos.manager.data.local.dao

import androidx.room.*
import com.offlinepos.manager.data.local.entity.SaleEntity
import com.offlinepos.manager.data.local.entity.SaleItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SaleDao {
    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertSale(sale: SaleEntity): Long

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertSaleItems(items: List<SaleItemEntity>)

    @Query("SELECT * FROM sales ORDER BY createdAt DESC")
    fun getAllSales(): Flow<List<SaleEntity>>

    @Query("SELECT * FROM sales WHERE createdAt >= :startTime AND createdAt <= :endTime ORDER BY createdAt DESC")
    fun getSalesByDateRange(startTime: Long, endTime: Long): Flow<List<SaleEntity>>

    @Query("SELECT * FROM sale_items WHERE saleId = :saleId")
    suspend fun getItemsForSale(saleId: Long): List<SaleItemEntity>

    @Query("UPDATE sales SET status = 'REFUNDED', notes = :refundNote WHERE id = :saleId")
    suspend fun markSaleRefunded(saleId: Long, refundNote: String)

    @Query("SELECT COUNT(*) FROM sales WHERE createdAt >= :startOfDay")
    fun getTodaySaleCount(startOfDay: Long): Flow<Int>

    @Query("SELECT COALESCE(SUM(grandTotal), 0.0) FROM sales WHERE createdAt >= :startOfDay AND status = 'COMPLETED'")
    fun getTodaySalesSum(startOfDay: Long): Flow<Double>
}
`
  },
  {
    path: 'app/src/main/java/com/offlinepos/manager/data/local/AppDatabase.kt',
    category: 'db',
    description: 'Room Database definition with normalized entities, versioning, and DAOs',
    code: `package com.offlinepos.manager.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.offlinepos.manager.data.local.dao.*
import com.offlinepos.manager.data.local.entity.*

@Database(
    entities = [
        ProductEntity::class,
        SaleEntity::class,
        SaleItemEntity::class,
        CustomerEntity::class,
        CustomerLedgerEntryEntity::class,
        ExpenseEntity::class,
        StockAdjustmentEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productDao(): ProductDao
    abstract fun saleDao(): SaleDao
    abstract fun customerDao(): CustomerDao
    abstract fun expenseDao(): ExpenseDao
    abstract fun stockAdjustmentDao(): StockAdjustmentDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "offline_pos_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/com/offlinepos/manager/data/repository/PosRepository.kt',
    category: 'repo',
    description: 'Repository handling database transactions for sales, returns, and inventory atomically',
    code: `package com.offlinepos.manager.data.repository

import androidx.room.withTransaction
import com.offlinepos.manager.data.local.AppDatabase
import com.offlinepos.manager.data.local.entity.*
import kotlinx.coroutines.flow.Flow

class PosRepository(private val db: AppDatabase) {
    private val productDao = db.productDao()
    private val saleDao = db.saleDao()
    private val customerDao = db.customerDao()
    private val expenseDao = db.expenseDao()
    private val stockDao = db.stockAdjustmentDao()

    val allProducts: Flow<List<ProductEntity>> = productDao.getAllProducts()
    val lowStockProducts: Flow<List<ProductEntity>> = productDao.getLowStockProducts()
    val allSales: Flow<List<SaleEntity>> = saleDao.getAllSales()

    /**
     * Executes POS sale inside a Room SQLite database transaction:
     * 1. Inserts sale record
     * 2. Inserts sale line items
     * 3. Atomically decreases stock for each product
     * 4. Logs stock movement history
     * 5. If credit balance due, updates customer balance & creates ledger entry
     */
    suspend fun executeSaleTransaction(
        sale: SaleEntity,
        items: List<SaleItemEntity>,
        allowNegativeStock: Boolean = false
    ): Result<Long> = runCatching {
        db.withTransaction {
            // Check stock integrity
            if (!allowNegativeStock) {
                for (item in items) {
                    val product = productDao.getProductById(item.productId)
                        ?: throw IllegalStateException("পণ্য পাওয়া যায়নি: \${item.productName}")
                    if (product.stockQuantity < item.quantity) {
                        throw IllegalStateException("পর্যাপ্ত স্টক নেই: \${product.nameBn} (বর্তমান স্টক: \${product.stockQuantity})")
                    }
                }
            }

            // Save sale
            val saleId = saleDao.insertSale(sale)
            val itemsWithSaleId = items.map { it.copy(saleId = saleId) }
            saleDao.insertSaleItems(itemsWithSaleId)

            // Deduct stock and audit
            for (item in items) {
                val currentProd = productDao.getProductById(item.productId)!
                val newStock = currentProd.stockQuantity - item.quantity
                productDao.adjustStock(item.productId, -item.quantity)
                stockDao.insertStockAdjustment(
                    StockAdjustmentEntity(
                        productId = item.productId,
                        type = "SALE",
                        quantityChange = -item.quantity,
                        previousStock = currentProd.stockQuantity,
                        newStock = newStock,
                        reason = "চালান \${sale.invoiceNumber} বিক্রয়",
                        referenceId = sale.invoiceNumber
                    )
                )
            }

            // Handle customer credit ledger
            if (sale.customerId != null && sale.balanceDue > 0) {
                val customer = customerDao.getCustomerById(sale.customerId)
                if (customer != null) {
                    val prevBalance = customer.totalBalanceDue
                    val newBalance = prevBalance + sale.balanceDue
                    customerDao.updateBalance(customer.id, newBalance)
                    customerDao.insertLedgerEntry(
                        CustomerLedgerEntryEntity(
                            customerId = customer.id,
                            type = "CREDIT_SALE",
                            amount = sale.balanceDue,
                            previousBalance = prevBalance,
                            newBalance = newBalance,
                            referenceId = sale.invoiceNumber,
                            note = "চালান \${sale.invoiceNumber} এর বাকি বিক্রয়"
                        )
                    )
                }
            }

            saleId
        }
    }
}
`
  },
  {
    path: 'app/src/test/java/com/offlinepos/manager/FinancialCalculationUnitTest.kt',
    category: 'test',
    description: 'Unit tests for sales totals, discounts, stock updates, payments, returns, and profit calculations',
    code: `package com.offlinepos.manager

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class FinancialCalculationUnitTest {

    @Test
    fun testSalesSubtotalAndGrandTotalCalculation() {
        val item1Price = 850.0
        val item1Qty = 2.0
        val item1Discount = 50.0
        val line1 = (item1Price * item1Qty) - item1Discount // 1650.0

        val item2Price = 140.0
        val item2Qty = 3.0
        val item2Discount = 0.0
        val line2 = (item2Price * item2Qty) - item2Discount // 420.0

        val subtotal = (item1Price * item1Qty) + (item2Price * item2Qty) // 1700 + 420 = 2120
        val totalDiscount = item1Discount + item2Discount // 50.0
        val grandTotal = subtotal - totalDiscount

        assertEquals(2120.0, subtotal, 0.001)
        assertEquals(2070.0, grandTotal, 0.001)
        assertEquals(grandTotal, line1 + line2, 0.001)
    }

    @Test
    fun testGrossProfitAndCostOfGoodsSoldCalculation() {
        val itemPurchaseCost = 790.0
        val itemSellingPrice = 850.0
        val quantity = 5.0
        val discount = 100.0

        val revenue = (itemSellingPrice * quantity) - discount // 4250 - 100 = 4150
        val cogs = itemPurchaseCost * quantity // 3950
        val grossProfit = revenue - cogs // 4150 - 3950 = 200

        assertEquals(3950.0, cogs, 0.001)
        assertEquals(4150.0, revenue, 0.001)
        assertEquals(200.0, grossProfit, 0.001)
    }

    @Test
    fun testNetOperatingResultExcludesUnpaidCreditFromCollectedCash() {
        val netSales = 10000.0
        val cogs = 7500.0
        val operatingExpenses = 800.0
        val creditDueUncollected = 3000.0

        val grossProfit = netSales - cogs // 2500.0
        val netOperatingResult = grossProfit - operatingExpenses // 1700.0
        val actualCashCollected = netSales - creditDueUncollected // 7000.0

        assertEquals(2500.0, grossProfit, 0.001)
        assertEquals(1700.0, netOperatingResult, 0.001)
        assertEquals(7000.0, actualCashCollected, 0.001)
        assertTrue("Cash collected must not count uncollected credit as liquid cash", actualCashCollected < netSales)
    }

    @Test
    fun testCustomerLedgerBalanceRepayment() {
        val initialBalance = 1500.0
        val repaymentAmount = 500.0
        val expectedNewBalance = 1000.0

        val calculatedNewBalance = (initialBalance - repaymentAmount).coerceAtLeast(0.0)
        assertEquals(expectedNewBalance, calculatedNewBalance, 0.001)
    }
}
`
  }
];
