
import React from 'react';
import { Teacher } from '../../types';

interface TeacherSubscriptionsViewProps {
    teacher: Teacher;
}

const TeacherSubscriptionsView: React.FC<TeacherSubscriptionsViewProps> = ({ teacher }) => {
    return (
        <div>
            <h2>Subscriptions for {teacher.name}</h2>
        </div>
    );
};

export default TeacherSubscriptionsView;
