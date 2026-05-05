const { withMainActivity, withAndroidManifest } = require('@expo/config-plugins');

function withHealthConnectMainActivity(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;

    // 1. Add the required import statement
    const importStatement = "import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate\n";
    if (!contents.includes("dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate")) {
      contents = contents.replace(
        "import android.os.Bundle",
        importStatement + "import android.os.Bundle"
      );
    }

    // 2. Add the initialization call inside onCreate
    const delegateStatement = "    HealthConnectPermissionDelegate.setPermissionDelegate(this)\n";
    if (!contents.includes("HealthConnectPermissionDelegate.setPermissionDelegate(this)")) {
      if (contents.includes("super.onCreate(null)")) {
        contents = contents.replace(
          "super.onCreate(null)",
          "super.onCreate(null)\n" + delegateStatement
        );
      } else if (contents.includes("super.onCreate(savedInstanceState)")) {
        contents = contents.replace(
          "super.onCreate(savedInstanceState)",
          "super.onCreate(savedInstanceState)\n" + delegateStatement
        );
      }
    }

    config.modResults.contents = contents;
    return config;
  });
}

function withHealthConnectManifest(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];
    
    // Ensure activity-alias array exists
    if (!application['activity-alias']) {
      application['activity-alias'] = [];
    }
    
    // Check if alias already exists
    const hasAlias = application['activity-alias'].some(
      (alias) => alias.$['android:name'] === 'ViewPermissionUsageActivity'
    );
    
    if (!hasAlias) {
      application['activity-alias'].push({
        $: {
          'android:name': 'ViewPermissionUsageActivity',
          'android:exported': 'true',
          'android:targetActivity': '.MainActivity',
          'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE'
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE' } }],
            category: [{ $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } }]
          }
        ]
      });
    }
    
    return config;
  });
}

module.exports = function withHealthConnectConfig(config) {
  config = withHealthConnectMainActivity(config);
  config = withHealthConnectManifest(config);
  return config;
};
