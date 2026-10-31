import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from './androidProjectCode';

export async function generateAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root project files
  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Offline POS Manager"
include(":app")
`
  );

  zip.file(
    'gradle/wrapper/gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  zip.file(
    'app/src/main/res/values/strings.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">কাগজ বক্স POS</string>
    <string name="dashboard">Dashboard</string>
    <string name="pos">POS Sales</string>
    <string name="products">Products</string>
    <string name="customers">Customers</string>
    <string name="reports">Reports</string>
</resources>
`
  );

  zip.file(
    'app/src/main/res/values-bn/strings.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">কাগজ বক্স POS</string>
    <string name="dashboard">ড্যাশবোর্ড</string>
    <string name="pos">বিক্রয়</string>
    <string name="products">পণ্য তালিকা</string>
    <string name="customers">গ্রাহক ও বাকি</string>
    <string name="reports">হিসাব-নিকাশ</string>
</resources>
`
  );

  zip.file(
    'app/src/main/res/xml/file_paths.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="external_files" path="."/>
</paths>
`
  );

  zip.file(
    'README.md',
    `# Offline POS Manager (কাগজ বক্স) - Android Studio Project

Offline-first Point of Sale (POS) and Credit Ledger Android application built with Kotlin, Jetpack Compose, Room (SQLite), and Material 3.

## How to Build the APK in Android Studio:

1. Open Android Studio (Ladybug / Koala / Hedgehog or newer).
2. Click **Open** and select this unzipped folder.
3. Wait for Gradle Sync to complete.
4. To build the Debug APK:
   - In the top menu, go to: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
   - Or run in terminal: \`./gradlew assembleDebug\`
5. Once finished, Android Studio will show a popup with a **locate** button.
   - The APK will be located at: \`app/build/outputs/apk/debug/app-debug.apk\`
6. Copy \`app-debug.apk\` to your Android phone and install!

## Features:
- 100% Offline (Room Database with SQLite transactions)
- Bengali (বাংলা) & English localization
- BDT (৳) currency
- Role-based multi-user management (Admin, Manager, Salesman, Accountant)
- Day & Night (Dark / Light) themes
- Customer credit ledger and debt tracking
- 80mm/58mm thermal receipt printing and PDF generation
- Accurate financial reporting with Cost of Goods Sold (COGS)
`
  );

  // Add all files from ANDROID_PROJECT_FILES
  for (const f of ANDROID_PROJECT_FILES) {
    let cleanPath = f.path.replace(' (Project)', '');
    zip.file(cleanPath, f.code);
  }

  // Include the real built APK inside the ZIP
  try {
    const apkRes = await fetch('/downloads/app-debug.apk');
    if (apkRes.ok) {
      const apkBuffer = await apkRes.arrayBuffer();
      zip.file('APK_DOWNLOAD/app-debug.apk', apkBuffer);
      zip.file('.build-outputs/app-debug.apk', apkBuffer);
      zip.file('app/build/outputs/apk/debug/app-debug.apk', apkBuffer);
    }
  } catch (err) {
    console.warn('Could not bundle prebuilt APK into ZIP:', err);
  }

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}
