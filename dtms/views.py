# Create your views here.

from django.http import HttpResponse
from django.conf import settings
from models import *
from django.shortcuts import render_to_response
from django.utils import simplejson as json
import operator
import pdb


def list(request):
    items = [ p.latest_revision() for p in Item_node.objects.all() ]
    return render_to_response('list.html', {"items": items})

def adduser(request):
    if not request.POST:
        return render_to_response('adduser.html', {'success': False})
    else:
        u = User(name=request.POST['name'], email=request.POST['email'], house_id=request.POST['house_id'], password=request.POST['password'])
        u.save()
        return HttpResponse('success')


def index(request):
    return render_to_response('index.html', {"names": User.objects.all(), "house_id": request.session['house_id']})



# fix the bad naming of variables
def add_item(request):
    if request.POST:
        x = json.loads(request.POST['string'])
        # should i record when things were edited? and where?

        # if there's an edit_id attribute, then edit the record
            # add item to db

        p_d = datetime.date(int(x['purch_date'][0]), int(x['purch_date'][1]), int(x['purch_date'][2]))


        if 'edit_id' in x:
            node = Item_node.objects.get(id=x['edit_id'])


        else:
            node = Item_node(archive_id=0)
            node.save()



    # ad many-to-many db entry
        # get list of all users involved w/ item
        total_users = map(lambda a,b: a or b, x['users_yes'], x['users_maybe'])
        total_users = [s for s in total_users if s != 0]

        # for each user, create a link and whether they're buying or not 
        for u in total_users:
            person = User.objects.get(id=u)

            #maybe.count(u) should always be 0 or 1
            link = Item_status(user=person, item=node, maybe_buying=x['users_maybe'].count(u))
            link.save()

        i = Item_model(name=x['name'], purch_date=p_d,
                       price=x['price'], buyer=x['buyer'],
                       comments=x['comments'], house_id=x['house_id'], 
                       node_id = node.id, item_head = node, tags=x['tags'])


        # gotta make interface to create the tags
        # get csv list of tags, retrieve them from Tag table
        # create Tag_rel link between items

        if x['tags']:

            pdb.set_trace()
            try:
                node.latest_revision().tags
            except:
                old_tags = set([])
            else:
                if node.latest_revision().tags:
                    old_tags = set([p.strip() for p in
                                    node.latest_revision().tags.split(',')])
                else:
                    old_tags = set([])

            new_tags = set([p.strip() for p in x['tags'].split(',')])
            diff = old_tags.symmetric_difference(new_tags)

            for k in diff:
                try:
                    t_name = Tag.objects.get(tag_name=k)
                # if exists in the diff, test if it already exist, then delete
                # the link. if doesn't exist, then create
                except:
                    t_name = Tag(tag_name=k)
                    t_name.save()
                    p = Tag_rel(tag=t_name, item=node)
                    p.save()
                else:
                    c = Tag_rel.objects.get(tag=t_name)
                    c.delete()
        i.save()

        return HttpResponse('success')

# sends item info to the add item page in order to fill it in
def edit_item(request):
    if request.POST:
        i_node = Item_node.objects.get(id=request.POST.get('item_id'))
        users = i_node.item_status_set.all()
        users_string = {}
        i = i_node.latest_revision()
        for x in users:
            users_string[x.user.id] = x.maybe_buying
        info = {'name': i.name, 'price': str(i.price), 'purch_date':
                i.purch_date.isoformat().replace('-','/'), 'tags': i.tags,
                'comments': i.comments, 'users': users_string} 
        return HttpResponse(json.dumps(info))


def login(request):
    # add in recovery from failed attempt
    if not request.POST:
        return render_to_response('login.html')
    else:
        m = User.objects.get(name=request.POST.get('user_name'))        
        if m.password == request.POST['password']:
            request.session['house_id'] = m.house_id
            return HttpResponse('yes')
        else:
            return HttpResponse('no')


def individual_bill(request):
    users = User.objects.filter(house_id=request.session['house_id'])
    sum = {}
    for a in users:
        sum[a.id] = 0

    for e in users:
        # item_stat is the intermediate object, so it's a list of Item_status 
        item_stat = e.item_status_set.all()

        # get all items that match the archive_id through the intermediate object
        # change archive_id to request.post object
        it = [ s.item for s in item_stat if s.item.archive_id==0 ]

        # now 'it' is a list of items the user is using that match the archive_id
        for i in it:
            num_users_per_item = len(i.users.all())
            sum[e.id] += i.price / num_users_per_item * -1
    
    # who-owes-what array
    for e in users:
        bought_items = Item_model.objects.filter(buyer=e.id)
        for b in bought_items:
            sum[e.id] += b.price
    # transactions
    transactions = [] 
    for (k,v) in sum.items():
        sum[k] = float(v)

    # while array is non zero
    while abs(max(sum.iteritems(), key=operator.itemgetter(1))[1]) > .01:

        owes = min(sum.iteritems(), key=operator.itemgetter(1))
        expects = max(sum.iteritems(), key=operator.itemgetter(1))
        

        if (owes[1] + expects[1]) < 0:
            amount = expects[1]
        else:
            amount = owes[1] * -1

        transactions.append([owes[0], expects[0], amount])
        sum[expects[0]] -= amount
        sum[owes[0]] += amount

    return HttpResponse('done')    


