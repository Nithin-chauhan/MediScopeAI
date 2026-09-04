import pandas as pd
import numpy as np
import os

def generate_diabetes(n=768):
    np.random.seed(42)
    data = {
        'Pregnancies': np.random.randint(0, 15, n),
        'Glucose': np.random.randint(0, 200, n),
        'BloodPressure': np.random.randint(0, 122, n),
        'SkinThickness': np.random.randint(0, 100, n),
        'Insulin': np.random.randint(0, 846, n),
        'BMI': np.random.uniform(0, 67.1, n),
        'DiabetesPedigreeFunction': np.random.uniform(0.078, 2.42, n),
        'Age': np.random.randint(21, 81, n),
        'Outcome': np.random.randint(0, 2, n)
    }
    # Make outcome more realistic based on glucose and BMI
    df = pd.DataFrame(data)
    df.loc[(df['Glucose'] > 140) & (df['BMI'] > 30), 'Outcome'] = 1
    df.loc[(df['Glucose'] < 100) & (df['BMI'] < 25), 'Outcome'] = 0
    df.to_csv('diabetes.csv', index=False)
    print("Generated diabetes.csv")

def generate_heart(n=1025):
    np.random.seed(42)
    data = {
        'age': np.random.randint(29, 77, n),
        'sex': np.random.randint(0, 2, n),
        'cp': np.random.randint(0, 4, n),
        'trestbps': np.random.randint(94, 200, n),
        'chol': np.random.randint(126, 564, n),
        'fbs': np.random.randint(0, 2, n),
        'restecg': np.random.randint(0, 3, n),
        'thalach': np.random.randint(71, 202, n),
        'exang': np.random.randint(0, 2, n),
        'oldpeak': np.random.uniform(0, 6.2, n),
        'slope': np.random.randint(0, 3, n),
        'ca': np.random.randint(0, 5, n),
        'thal': np.random.randint(0, 4, n),
        'target': np.random.randint(0, 2, n) # Note: 0=disease, 1=healthy originally, but prompt says flip it in training pipeline
    }
    df = pd.DataFrame(data)
    # Correlation to match prompt reasoning
    df.loc[(df['cp'] == 0) | (df['thal'] == 3), 'target'] = 0 # 0 meant disease originally
    df.loc[(df['cp'].isin([1,2])) | (df['thal'] == 2), 'target'] = 1
    df.to_csv('heart.csv', index=False)
    print("Generated heart.csv")

def generate_kidney(n=400):
    np.random.seed(42)
    data = {
        'age': np.random.randint(2, 90, n),
        'bp': np.random.randint(50, 180, n),
        'sg': np.random.choice([1.005, 1.010, 1.015, 1.020, 1.025], n),
        'al': np.random.randint(0, 6, n),
        'su': np.random.randint(0, 6, n),
        'rbc': np.random.choice(['normal', 'abnormal'], n),
        'pc': np.random.choice(['normal', 'abnormal'], n),
        'pcc': np.random.choice(['present', 'notpresent'], n),
        'ba': np.random.choice(['present', 'notpresent'], n),
        'bgr': np.random.randint(22, 490, n),
        'bu': np.random.uniform(1.5, 391, n),
        'sc': np.random.uniform(0.4, 76, n),
        'sod': np.random.uniform(4.5, 163, n),
        'pot': np.random.uniform(2.5, 47, n),
        'hemo': np.random.uniform(3.1, 17.8, n),
        'pcv': np.random.randint(9, 54, n),
        'wc': np.random.randint(2200, 26400, n),
        'rc': np.random.uniform(2.1, 8.0, n),
        'htn': np.random.choice(['yes', 'no'], n),
        'dm': np.random.choice(['yes', 'no'], n),
        'cad': np.random.choice(['yes', 'no'], n),
        'appet': np.random.choice(['good', 'poor'], n),
        'pe': np.random.choice(['yes', 'no'], n),
        'ane': np.random.choice(['yes', 'no'], n),
        'classification': np.random.choice(['ckd', 'notckd'], n)
    }
    df = pd.DataFrame(data)
    df.loc[(df['sc'] > 4) | (df['hemo'] < 10), 'classification'] = 'ckd'
    df.loc[(df['sc'] < 1.2) & (df['hemo'] > 12), 'classification'] = 'notckd'
    df.to_csv('kidney_disease.csv', index=False)
    print("Generated kidney_disease.csv")

def generate_liver(n=583):
    np.random.seed(42)
    data = {
        'Age': np.random.randint(4, 90, n),
        'Gender': np.random.choice(['Male', 'Female'], n),
        'Total_Bilirubin': np.random.uniform(0.4, 75, n),
        'Direct_Bilirubin': np.random.uniform(0.1, 19.7, n),
        'Alkaline_Phosphotase': np.random.randint(63, 2110, n),
        'Alamine_Aminotransferase': np.random.randint(10, 150, n),
        'Aspartate_Aminotransferase': np.random.randint(10, 150, n),
        'Total_Protiens': np.random.uniform(2.7, 9.6, n),
        'Albumin': np.random.uniform(0.9, 5.5, n),
        'Albumin_and_Globulin_Ratio': np.random.uniform(0.3, 2.8, n),
        'Dataset': np.random.choice([1, 2], n, p=[0.71, 0.29]) # 1=Disease, 2=Healthy
    }
    df = pd.DataFrame(data)
    df.loc[(df['Total_Bilirubin'] > 3) | (df['Alamine_Aminotransferase'] > 100), 'Dataset'] = 1
    df.loc[(df['Total_Bilirubin'] < 1.2) & (df['Alamine_Aminotransferase'] < 40), 'Dataset'] = 2
    df.to_csv('indian_liver_patient.csv', index=False)
    print("Generated indian_liver_patient.csv")

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    generate_diabetes()
    generate_heart()
    generate_kidney()
    generate_liver()
    print("All mock datasets generated successfully!")
