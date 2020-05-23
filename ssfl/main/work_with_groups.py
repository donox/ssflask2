from db_mgt.db_exec import DBExec
from ssfl.user_interaction.mail_handling import ManageMail


def work_with_groups_processor(db_exec: DBExec, form):
    """Functions to manage groups."""
    """
     Route: '/sysadmin/manage_groups' => manage_groups
     Template: manage_groups.jinja2
     Form: manage_groups_form.py
     Processor: manage_groups.py
    """
    function_to_execute = form.work_function.data
    group_name = form.group_name.data
    subject = form.subject.data
    message = form.message.data
    #   gr_sm gr_xx gr_xx gr_xx gr_xx gr_xx
    try:
        # This is callable by a 'User', need to restrict functions by role if necessary.
        # - for example, can't send message to groups in which the user is not a member, ...

        mailer = ManageMail()
        group_mgr = db_exec.create_group_manager()
        user_mgr = db_exec.create_user_manager()
        if function_to_execute == 'gr_sm':  # 'Send Message to Group
            group_id = group_mgr.get_group_id_from_name(group_name)
            recipients = group_mgr.get_group_members(db_exec,group_id)
            mailer.add_recipients([x.email for x in recipients])
            # sender = user_mgr.get_user_name_from_id(current_user.id)
            # mailer.add_sender(sender)
            mailer.add_title(subject)
            mailer.add_content(message)
            mailer.send_message()
            return True
        # elif function_to_execute == 'gr_del':  # Delete Existing Group
        #     group_id = group_mgr.get_group_id_from_name(group_name)
        #     if not group_id:
        #         form.errors['group_name'] = ['Group Does Not Exist']
        #         return False
        #     group_mgr.remove_group(group_id)
        #     return True
        # elif function_to_execute == 'gr_am':  # Download a csv file of the Page Table
        #     group_id = group_mgr.get_group_id_from_name(group_name)
        #     if not group_id:
        #         form.errors['group_name'] = ['Group Does Not Exist']
        #         return False
        #     member_id = user_mgr.get_user_id_from_name(member_name)
        #     if not member_id:
        #         form.errors['member_name'] = [f'Member: {member_name} not found']
        #         return False
        #     res = group_mgr.add_member_to_group(group_id, member_id)
        #     if not res:
        #         form.errors['Already There'] = [f'{member_name} is already a member of {group_name}']
        #     return res
        # elif function_to_execute == 'gr_rm':
        #     group_id = group_mgr.get_group_id_from_name(group_name)
        #     if not group_id:
        #         form.errors['group_name'] = ['Group Does Not Exist']
        #         return False
        #     member_id = user_mgr.get_user_id_from_name(member_name)
        #     if not member_id:
        #         form.errors['member_name'] = [f'Member: {member_name} not found']
        #         return False
        #     res = group_mgr.remove_member_from_group(group_id, member_id)
        #     if not res:
        #         raise SsTSystemError(f'Database did not find member or group after prior check for existence')
        #     return True
        # elif function_to_execute == 'gr_lg':  # List Groups - simple web page for now
        #     groups = group_mgr.get_all_groups()
        #     group_fields = group_mgr.get_table_fields('sstgroup')
        #     res_groups = []
        #     for a_group in groups:
        #         members = group_mgr.get_group_members(db_exec, a_group.id)
        #         dct = extract_fields_to_dict(a_group, group_fields)
        #         owner_id = dct['owner']
        #         dct['owner'] = user_mgr.get_user_name_from_id(owner_id)
        #         dct['nbr_members'] = len(members)
        #         dct['created'] = dct['created'].strftime('%m/%d/%Y')
        #         res_groups.append(dct)
        #     context = {'function': 'gr_lg',
        #                'fields': ['id', 'group name', 'owner', 'group purpose', 'status', 'created', 'nbr of members'],
        #                'values': res_groups}
        #     result = render_template(result_template, **context)
        #     return result
        # elif function_to_execute == 'gr_lm':  # List Members - simple web page for now
        #     member_fields = group_mgr.get_table_fields('sstgroup_member')
        #     group_id = group_mgr.get_group_id_from_name(group_name)
        #     members = group_mgr.get_group_members(db_exec, group_id)
        #     res_members = []
        #     for member in members:
        #         dct = extract_fields_to_dict(member, member_fields)
        #         dct['member_name'] = member.username
        #         res_members.append(dct)
        #     context = {'function': 'gr_lm',
        #                'group_name': group_name,
        #                'fields': ['member_name'],
        #                'values': res_members}
        #     result = render_template(result_template, **context)
        #     return result
        else:
            form.errors['work_function'] = ['Selected Work Function Not Yet Implemented']
            return False
    except Exception as e:
        # TODO: handle error/log, and return useful message to user
        form.errors['work_function'] = ['working with groups - Exception occurred processing page']
        form.errors['work_function'] = [e.args]
        return False
