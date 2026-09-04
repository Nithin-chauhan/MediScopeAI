import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, VotingClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.impute import KNNImputer

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml', 'models')
SCALERS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml', 'scalers')

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(SCALERS_DIR, exist_ok=True)

def create_ensemble_model(y_train):
    pos_count = sum(y_train)
    neg_count = len(y_train) - pos_count
    scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1.0

    rf = RandomForestClassifier(n_estimators=300, max_depth=10, min_samples_leaf=3, class_weight='balanced', random_state=42)
    xgb = XGBClassifier(n_estimators=300, max_depth=5, learning_rate=0.05, subsample=0.8, scale_pos_weight=scale_pos_weight, random_state=42, eval_metric='logloss')
    lr = LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42)
    gb = GradientBoostingClassifier(n_estimators=200, learning_rate=0.1, max_depth=5, random_state=42)

    model = VotingClassifier(
        estimators=[('rf', rf), ('xgb', xgb), ('lr', lr), ('gb', gb)],
        voting='soft'
    )
    return model

def evaluate_and_save(model, scaler, X_test, y_test, name):
    X_test_scaled = scaler.transform(X_test)
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    auc = roc_auc_score(y_test, y_prob)

    print(f"--- {name.upper()} ---")
    print(f"Accuracy: {acc:.4f} | AUC: {auc:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | F1: {f1:.4f}")

    joblib.dump(model, os.path.join(MODELS_DIR, f"{name}_model.pkl"))
    joblib.dump(scaler, os.path.join(SCALERS_DIR, f"{name}_scaler.pkl"))
    
    # Save metrics for model dashboard
    metrics = {'accuracy': acc, 'auc': auc, 'precision': prec, 'recall': rec, 'f1': f1}
    joblib.dump(metrics, os.path.join(MODELS_DIR, f"{name}_metrics.pkl"))

def train_diabetes():
    df = pd.read_csv(os.path.join(DATA_DIR, 'diabetes.csv'))
    
    # Zero imputation
    cols_to_impute = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
    for col in cols_to_impute:
        df[col] = df[col].replace(0, df[col].median())
        
    X = df.drop('Outcome', axis=1)
    y = df['Outcome']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    model = create_ensemble_model(y_train)
    model.fit(X_train_scaled, y_train)
    
    evaluate_and_save(model, scaler, X_test, y_test, 'diabetes')

def train_heart():
    df = pd.read_csv(os.path.join(DATA_DIR, 'heart.csv'))
    
    X = df.drop('target', axis=1)
    y = df['target']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    model = create_ensemble_model(y_train)
    model.fit(X_train_scaled, y_train)
    
    evaluate_and_save(model, scaler, X_test, y_test, 'heart')

def train_kidney():
    df = pd.read_csv(os.path.join(DATA_DIR, 'kidney_disease.csv'))
    
    # Map target
    df['classification'] = df['classification'].map({'ckd': 1, 'notckd': 0, 'ckd\\t': 1})
    
    # Map categoricals
    cat_mapping = {
        'normal': 0, 'abnormal': 1,
        'present': 1, 'notpresent': 0,
        'yes': 1, 'no': 0,
        'good': 1, 'poor': 0
    }
    
    cat_cols = ['rbc', 'pc', 'pcc', 'ba', 'htn', 'dm', 'cad', 'appet', 'pe', 'ane']
    for col in cat_cols:
        if col in df.columns:
            df[col] = df[col].map(cat_mapping)
            
    # Numeric conversion
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        
    # Fillna median (NO dropna)
    for col in df.columns:
        if df[col].isnull().any():
            df[col].fillna(df[col].median(), inplace=True)
            
    X = df.drop('classification', axis=1)
    y = df['classification'].astype(int)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    model = create_ensemble_model(y_train)
    model.fit(X_train_scaled, y_train)
    
    evaluate_and_save(model, scaler, X_test, y_test, 'kidney')

def train_liver():
    df = pd.read_csv(os.path.join(DATA_DIR, 'indian_liver_patient.csv'))
    
    # Target map
    df['Dataset'] = df['Dataset'].map({1: 1, 2: 0})
    
    # Map Gender
    df['Gender'] = df['Gender'].map({'Male': 1, 'Female': 0})
    
    # Fillna
    for col in df.columns:
        if df[col].isnull().any():
            df[col].fillna(df[col].median(), inplace=True)
            
    X = df.drop('Dataset', axis=1)
    y = df['Dataset'].astype(int)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    model = create_ensemble_model(y_train)
    model.fit(X_train_scaled, y_train)
    
    evaluate_and_save(model, scaler, X_test, y_test, 'liver')

if __name__ == "__main__":
    print("Starting model training...")
    train_diabetes()
    train_heart()
    train_kidney()
    train_liver()
    print("All models trained and saved successfully.")
