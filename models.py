from django.db import models

# Create your models here.
class Flight(models.Model):
	origin_code = models.CharField(max_length=4) 
	dest_code =  models.CharField(max_length=4) 
	depart_date =  models.CharField(max_length=200) 
	return_date = models.CharField(max_length=200) 
	price = models.IntegerField()
	number = models.CharField(max_length=200)
	
	def __unicode__(self):
		return self.number
		
class City(models.Model):
	name = models.CharField(max_length=200)
	state = models.CharField(max_length=200)
	country = models.CharField(max_length=200)
	
	def __unicode__(self):
		return self.name
		
class Airport(models.Model):
	city = models.ForeignKey(City)
	airport_code = models.CharField(max_length=5)
	
	def __unicode__(self):
		return self.airport_code