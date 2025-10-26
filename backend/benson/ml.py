#start to deployment
sagemaker_session = sagemaker.Session()
bucket_name="so-chopped-bucket-67"
prefix="so-chopped-ai"
role=sagemaker.get_execution_role()

#notsure what this is
# buf=io.BytesIO()
# smac.write_numpy_to_dense_tensor(buf,X_train,y_train)
# buf.seek(0) 

#might need to recreate bucket if errrors not sure why
key = "muse-ml"

boto3.resource('s3').Bucket(bucket_name).Object(os.path.join(prefix, 'train',key)).upload_fileobj(buf)

s3_train_data=f"s3://{bucket_name}/{prefix}/train/{key}"

print("data uploaded",s3_train_data)
#because of this code you can basically see whats been updated to the bucket
 
output_location=f"s3://{bucket_name}/{prefix}/output"
#output_location  check this line I think this guy just used as a print statement so omit as you please

container=sagemaker.image_uris_retrieve("so-chopped-ai",boto3.Session().region_name)

#check this
randomForestRegression=sagemaker.estimator.Estimator(container,role,instance_count=1,instance_type="ml.c4.xlarge",outout_path=output_location,sagemaker_session=sagemaker_session)

#check this
randomForestRegression.set.hyperparameters(feature_dim=1,predictor_type="regressor",mini_batch_size=4,epochs=6,num_models=32,loss="absolute_loss")

 
linear.fit({"train":s3_train_data})

#deploy the model
so_chopped_model=linear.deploy(initial_instance_count=1,instance_type="ml.m4.xlarge")

#after this check inference endpoints to see if ur up on the gui

#here are some ml test idk if this is true
# so_chopped_model.serializer=sagemaker.serializers.CSVSerializer()
# so_chopped_model.deserializers=sagemaker.deserializers.JSONDeserializer()

# results=so_chopped_model.predict(X_test)




